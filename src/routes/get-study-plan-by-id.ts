import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const paramsSchema = z.object({
    id: z.coerce.number().int().positive(),
});

export async function getStudyPlanById(request: FastifyRequest, reply: FastifyReply) {
    const { user_id } = request.user;
    const { id } = paramsSchema.parse(request.params);

    const studyPlan = await prisma.studyPlan.findFirst({
        where: {
            study_plan_id: id,
            user_id,
        },
        include: {
            Content: {
                include: {
                    study_plan_day: {
                        select: {
                            study_plan_day_id: true,
                            date: true,
                            status: true, // ADICIONADO
                            allocated_minutes: true,
                            studied_minutes: true,
                            description: true, // ADICIONADO - campo novo
                            content_id: true,
                        },
                        orderBy: {
                            date: 'asc', // Ordenar por data
                        },
                    },
                },
                orderBy: {
                    content_id: 'asc', // Manter ordem de criação
                },
            },
        },
    });

    if (!studyPlan) {
        return reply.status(404).send({ 
            message: "Plano de estudo não encontrado" 
        });
    }

    return reply.status(200).send(studyPlan);
}