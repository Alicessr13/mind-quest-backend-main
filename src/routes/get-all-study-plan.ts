import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "@/lib/prisma";

export async function getAllStudyPlans(request: FastifyRequest, reply: FastifyReply) {
    const { user_id } = request.user;

    const studyPlans = await prisma.studyPlan.findMany({
        where: { user_id },
        select: {
            study_plan_id: true,
            subject: true,
            start_date: true,
            end_date: true,
            week_days: true,
            minutes_per_day: true,
            total_minutes: true,
        },
    });

    return reply.status(200).send(studyPlans);
}