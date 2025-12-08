import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Status } from "@prisma/client";
import { AppError } from "@/errors/app-error";

const paramsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

const bodySchema = z.object({
    status: z.nativeEnum(Status),
});

export async function patchStudyPlanStatus(request: FastifyRequest, reply: FastifyReply) {
    const { user_id } = request.user;
    const { id } = paramsSchema.parse(request.params);
    const { status } = bodySchema.parse(request.body);

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
        }
    });

    if (!selectStudyPlanDay) {
        throw new AppError('Dia de estudo não encontrado', 404);
    }

    const { content, ...studyPlanDay } = selectStudyPlanDay;
    const studied_minutes = status === Status.Completed ? studyPlanDay.allocated_minutes : 0;

    // Atualiza o dia de estudo
    await prisma.studyPlanDay.update({
        where: { study_plan_day_id: id },
        data: {
            studied_minutes,
            status,
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
