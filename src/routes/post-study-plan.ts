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

// Função auxiliar para processar em lotes (evita rate limiting)
async function processBatch<T, R>(
    items: T[],
    batchSize: number,
    processor: (item: T) => Promise<R>
): Promise<R[]> {
    const results: R[] = [];
    
    for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(processor));
        results.push(...batchResults);
    }
    
    return results;
}

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

    // 1. Calcular total de minutos e dias de estudo
    let total_minutes = 0;
    let study_days_count = 0;
    const valid_study_dates: Date[] = [];

    for (let i = 0; i <= days; ++i) {
        const current_date = addDays(start_date, i);
        if (week_days.has(current_date.getDay())) {
            total_minutes += minutes_per_day;
            study_days_count++;
            valid_study_dates.push(current_date);
        }
    }

    console.log(`📊 Total de dias de estudo: ${study_days_count}`);
    console.log(`⏱️  Total de minutos: ${total_minutes}`);

    // 2. Gerar plano de estudos
    const aiResponse = await generateStudyPlan({ subject, total_minutes });

    console.log(`📚 Subtópicos gerados: ${aiResponse.subtopics.length}`);
    console.log(`⏱️  Total alocado: ${aiResponse.subtopics.reduce((sum, st) => sum + st.allocated_minutes, 0)} minutos`);

    // 3. Salvar Plano
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

    // 4. Salvar conteúdos
    const contents = await prisma.content.createManyAndReturn({
        data: aiResponse.subtopics.map(subtopic => ({
            subject: subtopic.name,
            allocated_minutes: subtopic.allocated_minutes,
            study_plan_id,
        })),
    });

    // 5. Distribuir subtópicos pelos dias de estudo
    interface DailyTask {
        date: Date;
        content_id: number;
        content_index: number;
        allocated_minutes: number;
        day_number: number;
    }

    const dailyTasks: DailyTask[] = [];
    let content_index = 0;
    let minutes_remaining_in_current_content = contents[0]?.allocated_minutes || 0;

    for (let day_number = 1; day_number <= study_days_count; day_number++) {
        const current_date = valid_study_dates[day_number - 1];
        let minutes_left_today = minutes_per_day;

        while (minutes_left_today > 0 && content_index < contents.length) {
            const current_content = contents[content_index];

            if (minutes_remaining_in_current_content === 0) {
                content_index++;
                if (content_index >= contents.length) break;
                minutes_remaining_in_current_content = contents[content_index].allocated_minutes;
                continue;
            }

            const minutes_to_allocate = Math.min(
                minutes_left_today,
                minutes_remaining_in_current_content
            );

            dailyTasks.push({
                date: current_date,
                content_id: contents[content_index].content_id,
                content_index: content_index,
                allocated_minutes: minutes_to_allocate,
                day_number,
            });

            minutes_left_today -= minutes_to_allocate;
            minutes_remaining_in_current_content -= minutes_to_allocate;
        }
    }

    console.log(`📅 Tarefas diárias criadas: ${dailyTasks.length}`);

    // 6. Gerar descrições em lotes de 5 por vez (evita rate limiting)
    const results = await processBatch(
        dailyTasks,
        5, // Processar 5 chamadas por vez
        async (task) => {
            const current_subtopic = aiResponse.subtopics[task.content_index];
            
            const dailyDesc = await generateDailyDescription({
                subject: aiResponse.subject,
                subtopic: current_subtopic.name,
                allocated_minutes: task.allocated_minutes,
                day_number: task.day_number,
                total_days: study_days_count,
                learning_objectives: current_subtopic.learning_objectives,
                is_first_day: task.day_number === 1,
                is_last_day: task.day_number === study_days_count,
            });

            return {
                ...task,
                dailyDesc,
            };
        }
    );

    // 7. Salvar todos os dias de estudo
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

    console.log(`✅ ${studyDaysData.length} dias salvos no banco de dados`);

    return reply.status(201).send({ 
        study_plan_id,
        days_created: studyDaysData.length,
        expected_days: study_days_count,
    });
}