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

    // Calcular total de minutos e dias de estudo
    let total_minutes = 0;
    let study_days_count = 0;

    for (let i = 0; i <= days; ++i) {
        const currentDay = addDays(start_date, i);
        if (week_days.has(currentDay.getDay())) {
            total_minutes += minutes_per_day;
            study_days_count++;
        }
    }

    // Gerar plano de estudos com a IA
    const aiResponse = await generateStudyPlan({ subject, total_minutes });

    // Criar o plano de estudos
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

    // Criar os conteúdos (subtópicos)
    const contents = await prisma.content.createManyAndReturn({
        data: aiResponse.subtopics.map(subtopic => ({
            subject: subtopic.name,
            allocated_minutes: subtopic.allocated_minutes,
            study_plan_id,
        })),
    });

    // LÓGICA CORRIGIDA: Distribuir conteúdos pelos dias
    let content_index = 0;
    let current_day_number = 0;
    let minutes_remaining_in_current_content = contents[0]?.allocated_minutes || 0;

    for (let i = 0; i <= days; ++i) {
        const current_day = addDays(start_date, i);

        // Pular dias que não são dias de estudo
        if (!week_days.has(current_day.getDay())) {
            continue;
        }

        current_day_number++;

        // Se já processamos todos os conteúdos, parar
        if (content_index >= contents.length) {
            break;
        }

        let minutes_left_today = minutes_per_day;

        // Enquanto houver tempo disponível neste dia
        while (minutes_left_today > 0 && content_index < contents.length) {
            const current_content = contents[content_index];
            const current_subtopic = aiResponse.subtopics[content_index];

            // Se este é um novo conteúdo, resetar os minutos restantes
            if (minutes_remaining_in_current_content === 0) {
                minutes_remaining_in_current_content = current_content.allocated_minutes;
            }

            // Calcular quanto tempo alocar neste dia para este conteúdo
            const minutes_to_allocate = Math.min(
                minutes_left_today,
                minutes_remaining_in_current_content
            );

            // Gerar descrição personalizada para este dia
            const dailyDesc = await generateDailyDescription({
                subject: aiResponse.subject,
                subtopic: current_subtopic.name,
                allocated_minutes: minutes_to_allocate,
                day_number: current_day_number,
                total_days: study_days_count,
                learning_objectives: current_subtopic.learning_objectives,
                is_first_day: current_day_number === 1,
                is_last_day: current_day_number === study_days_count,
            });

            // Formatar descrição completa
            const full_description = `${dailyDesc.description}

📌 Pontos-chave:
${dailyDesc.key_points.map((point, idx) => `${idx + 1}. ${point}`).join('\n')}

💡 Atividades sugeridas:
${dailyDesc.suggested_activities.map((activity, idx) => `${idx + 1}. ${activity}`).join('\n')}`;

            // Criar dia do plano de estudos
            await prisma.studyPlanDay.create({
                data: {
                    allocated_minutes: minutes_to_allocate,
                    date: current_day,
                    description: full_description,
                    content_id: current_content.content_id,
                },
            });

            // Atualizar contadores
            minutes_left_today -= minutes_to_allocate;
            minutes_remaining_in_current_content -= minutes_to_allocate;

            // Se terminamos este conteúdo, avançar para o próximo
            if (minutes_remaining_in_current_content === 0) {
                content_index++;
            }
        }
    }

    return reply.status(201).send({ study_plan_id });
}