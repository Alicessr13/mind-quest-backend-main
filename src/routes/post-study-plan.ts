import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { addDays, differenceInDays } from "date-fns";
import { gpt } from "@/lib/openai";
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

    let total_minutes = 0;

    for (let i = 0; i <= days; ++i) {
        const currentDay = addDays(start_date, i);

        if (week_days.has(currentDay.getDay())) {
            total_minutes += minutes_per_day;
        }
    }

    const response = await gpt({ subject, total_minutes });

    const { study_plan_id } = await prisma.studyPlan.create({
        select: { study_plan_id: true },
        data: {
            subject: response.subject,
            start_date,
            end_date,
            week_days: Array.from(week_days),
            minutes_per_day,
            total_minutes,
            user_id,
        },
    });

    const contents = await prisma.content.createManyAndReturn({
        data: response.subtopics.map(content => {
            return {
                subject: content.name,
                allocated_minutes: content.allocated_minutes,
                study_plan_id,
            };
        }),
    });

    let content_index = 0;

    for (let i = 0; i <= days; ++i) {
        const current_day = addDays(start_date, i);

        if (!week_days.has(current_day.getDay())) {
            continue;
        }

        while (content_index < contents.length) {
            const current_content = contents[content_index];

            const study_plan_days = await prisma.studyPlanDay.findMany({
                select: { allocated_minutes: true },
                where: { content_id: current_content.content_id },
            });

            const total_allocated_minutes = study_plan_days.reduce((sum, day) => sum + day.allocated_minutes, 0);
            const remaining_minutes = current_content.allocated_minutes - total_allocated_minutes;

            if (remaining_minutes) {
                const minutes_available = Math.min(minutes_per_day, remaining_minutes);
                await prisma.studyPlanDay.create({
                    data: {
                        allocated_minutes: minutes_available,
                        date: current_day,
                        content_id: contents[content_index].content_id,
                    },
                });
                break;
            }

            content_index++;
        }
    }

    return reply.status(201).send();
}
