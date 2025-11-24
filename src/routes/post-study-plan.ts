import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { addDays, differenceInDays } from "date-fns";
import { generateStudyPlan, generateDailyDescription } from "@/lib/openai";
import { prisma } from "@/lib/prisma";

enum WeekDays {
    Sunday = 0,
    Monday = 1,
    Tuesday = 2,
    Wednesday = 3,
    Thursday = 4,
    Friday = 5,
    Saturday = 6,
}

const bodySchema = z.object({
    subject: z.string(),
    start_date: z.coerce.date(),
    end_date: z.coerce.date(),
    week_days: z
        .array(z.nativeEnum(WeekDays))
        .refine(days => new Set(days).size === days.length)
        .transform(days => new Set(days)),
    minutes_per_day: z.number().positive(),
});

// Função postStudyPlan refatorada para paralelismo:

export async function postStudyPlan(request: FastifyRequest, reply: FastifyReply) {
    const { user_id } = request.user;
    const {
        subject,
        start_date,
        end_date,
        week_days,
        minutes_per_day,
    } = bodySchema.parse(request.body);

    const days = differenceInDays(end_date, start_date);

    // 1. Pré-cálculo do total de minutos
    let total_minutes = 0;
    let study_days_count = 0;
    for (let i = 0; i <= days; ++i) {
        if (week_days.has(addDays(start_date, i).getDay())) {
            total_minutes += minutes_per_day;
            study_days_count++;
        }
    }

    const aiResponse = await generateStudyPlan({ subject, total_minutes });

    // 🚨 CORREÇÃO: Assegurar que o tempo total dos subtópicos não exceda o total_minutes
    let current_total = 0;
    const validated_subtopics = [];

    for (const subtopic of aiResponse.subtopics) {
        const remaining_minutes = total_minutes - current_total;

        // Se não há mais tempo disponível (ou o tempo é insignificante), parar
        if (remaining_minutes <= 0) {
            break;
        }

        // Se o tempo alocado para este subtópico excede o tempo restante, trunca
        if (current_total + subtopic.allocated_minutes > total_minutes) {
            subtopic.allocated_minutes = remaining_minutes;
        }

        current_total += subtopic.allocated_minutes;
        validated_subtopics.push(subtopic);
    }

    // Atualiza a resposta da IA com os subtópicos corrigidos
    aiResponse.subtopics = validated_subtopics;
    // Note: Se current_total for menor que total_minutes, a IA não usou todo o tempo,
    // mas é um problema menor do que exceder. Você pode forçar a IA a preencher o tempo no prompt se for crucial.

    // 3. Salvar Plano e Conteúdos (em lote)
    const { study_plan_id } = await prisma.studyPlan.create({
        select: { study_plan_id: true },
        data: {
            subject: aiResponse.subject,
            start_date,
            end_date,
            week_days: Array.from(week_days),
            minutes_per_day,
            total_minutes,
            user_id,
        },
    });

    // Usar createMany para salvar conteúdos em lote
    const contents = await prisma.content.createManyAndReturn({
        data: aiResponse.subtopics.map(subtopic => ({
            subject: subtopic.name,
            allocated_minutes: subtopic.allocated_minutes,
            study_plan_id,
        })),
    });

    // 4. Coletar todas as chamadas de IA (PARALELISMO)
    let content_index = 0;
    let current_day_number = 0;
    let minutes_remaining_in_current_content = contents[0]?.allocated_minutes || 0;

    const dailyCallPromises: Promise<{
        date: Date;
        content_id: number;
        allocated_minutes: number;
        dailyDesc: { description: string; key_points: string[]; suggested_activities: string[] };
    }>[] = [];

    for (let i = 0; i <= days; ++i) {
        const current_day = addDays(start_date, i);

        if (!week_days.has(current_day.getDay())) {
            continue;
        }

        current_day_number++;

        if (content_index >= contents.length) {
            break;
        }

        let minutes_left_today = minutes_per_day;

        while (minutes_left_today > 0 && content_index < contents.length) {
            const current_content = contents[content_index];
            const current_subtopic = aiResponse.subtopics[content_index];

            if (minutes_remaining_in_current_content === 0) {
                minutes_remaining_in_current_content = current_content.allocated_minutes;
            }

            const minutes_to_allocate = Math.min(
                minutes_left_today,
                minutes_remaining_in_current_content
            );

            // Adiciona a chamada de IA (promessa) para execução posterior
            const dailyDescPromise = generateDailyDescription({
                subject: aiResponse.subject,
                subtopic: current_subtopic.name,
                allocated_minutes: minutes_to_allocate,
                day_number: current_day_number,
                total_days: study_days_count,
                learning_objectives: current_subtopic.learning_objectives,
                is_first_day: current_day_number === 1,
                is_last_day: current_day_number === study_days_count,
            }).then(dailyDesc => ({
                date: current_day,
                content_id: current_content.content_id,
                allocated_minutes: minutes_to_allocate,
                dailyDesc,
            }));

            dailyCallPromises.push(dailyDescPromise);

            minutes_left_today -= minutes_to_allocate;
            minutes_remaining_in_current_content -= minutes_to_allocate;

            if (minutes_remaining_in_current_content === 0) {
                content_index++;
            }
        }
    }

    // 5. Executar todas as chamadas de descrição diária em PARALELO!
    const results = await Promise.all(dailyCallPromises);

    // 6. Salvar todos os dias de estudo no banco de dados em LOTE
    const studyDaysData = results.map(({ date, content_id, allocated_minutes, dailyDesc }) => {
        const full_description = `${dailyDesc.description}

📌 Pontos-chave:
${dailyDesc.key_points.map((point, idx) => `${idx + 1}. ${point}`).join('\n')}

💡 Atividades sugeridas:
${dailyDesc.suggested_activities.map((activity, idx) => `${idx + 1}. ${activity}`).join('\n')}`;

        return {
            allocated_minutes,
            date,
            description: full_description,
            content_id,
        };
    });

    await prisma.studyPlanDay.createMany({
        data: studyDaysData,
    });

    return reply.status(201).send({ study_plan_id });
}