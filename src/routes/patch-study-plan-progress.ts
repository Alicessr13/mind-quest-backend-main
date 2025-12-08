import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Status } from "@prisma/client";
import { AppError } from "@/errors/app-error";

const paramsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

const bodySchema = z.object({
    studied_minutes: z.number(),
});

export async function patchStudyPlanProgress(request: FastifyRequest, reply: FastifyReply) {
    const { user_id } = request.user;
    const { id } = paramsSchema.parse(request.params);
    const { studied_minutes } = bodySchema.parse(request.body);

    // Busca o dia de estudo e valida se pertence ao usuário
    const selectStudyPlanDay = await prisma.studyPlanDay.findFirst({
        where: {
            study_plan_day_id: id,
            content: {
                study_plan: {
                    user_id,
                },
            },
        },
        include: {
            content: true,
        },
    });

    if (!selectStudyPlanDay) {
        throw new AppError('Dia de estudo não encontrado', 404);
    }

    const { content, ...studyPlanDay } = selectStudyPlanDay;

    // Calcula novos minutos estudados no dia
    const totalDayMinutes = studyPlanDay.studied_minutes + studied_minutes;
    const cappedDayMinutes = Math.min(totalDayMinutes, studyPlanDay.allocated_minutes);

    const newDayStatus =
        cappedDayMinutes >= studyPlanDay.allocated_minutes ? Status.Completed : Status.InProgress;

    // Atualiza o dia de estudo
    await prisma.studyPlanDay.update({
        where: { study_plan_day_id: id },
        data: {
            studied_minutes: cappedDayMinutes,
            status: newDayStatus,
        },
    });

    // Atualiza o conteúdo vinculado
    const { _sum } = await prisma.studyPlanDay.aggregate({
        where: { content_id: studyPlanDay.content_id },
        _sum: { studied_minutes: true },
    });

    const totalStudiedMinutes = _sum.studied_minutes ?? 0;

    const updatedContent = await prisma.content.update({
        where: { content_id: studyPlanDay.content_id },
        data: {
            studied_minutes: totalStudiedMinutes,
            status: totalStudiedMinutes >= content.allocated_minutes ? Status.Completed : Status.InProgress,
        },
    });

    if (updatedContent.status === Status.Completed) {
        const pointsEarned = Math.floor(updatedContent.allocated_minutes / 10);
        await prisma.user.update({
            where: { user_id: request.user.user_id },
            data: { points: { increment: pointsEarned } },
        });
    }

    return reply.status(200).send({
        message: "Progresso atualizado com sucesso",
    });
}
