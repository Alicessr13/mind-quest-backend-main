import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Status } from "@prisma/client";

const paramsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

const bodySchema = z.object({
    studied_minutes: z.number().positive(),
});

export async function patchStudyPlanDayProgress(request: FastifyRequest, reply: FastifyReply) {
    const { user_id } = request.user;
    const { id } = paramsSchema.parse(request.params);
    const { studied_minutes } = bodySchema.parse(request.body);

    // Busca o dia de estudo e valida se pertence ao usuário
    const studyPlanDay = await prisma.studyPlanDay.findUnique({
        where: { study_plan_day_id: id },
        include: {
            content: {
                include: {
                    study_plan: true,
                },
            },
        },
    });

    if (!studyPlanDay || studyPlanDay.content.study_plan.user_id !== user_id) {
        return reply.status(404).send({ message: "Dia de estudo não encontrado" });
    }

    // Calcula novos minutos estudados no dia
    const totalDayMinutes = studyPlanDay.studied_minutes + studied_minutes;
    const cappedDayMinutes = Math.min(totalDayMinutes, studyPlanDay.allocated_minutes);

    const newDayStatus =
        cappedDayMinutes >= studyPlanDay.allocated_minutes ? Status.Completed : Status.InProgress;

    // Atualiza o dia de estudo
    const updatedDay = await prisma.studyPlanDay.update({
        where: { study_plan_day_id: id },
        data: {
            studied_minutes: cappedDayMinutes,
            status: newDayStatus,
        },
    });

    // Atualiza o conteúdo vinculado
    const totalContentMinutes = studyPlanDay.content.studied_minutes + studied_minutes;
    const cappedContentMinutes = Math.min(totalContentMinutes, studyPlanDay.content.allocated_minutes);

    const newContentStatus =
        cappedContentMinutes >= studyPlanDay.content.allocated_minutes
            ? Status.Completed
            : Status.InProgress;

    const updatedContent = await prisma.content.update({
        where: { content_id: studyPlanDay.content_id },
        data: {
            studied_minutes: cappedContentMinutes,
            status: newContentStatus,
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
        studyPlanDay: updatedDay,
        content: updatedContent,
    });
}
