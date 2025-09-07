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
                    StudyPlanDay: true,
                },
            },
        },
    });

    if (!studyPlan) {
        return reply.status(404).send({ message: "Plano de estudo não encontrado" });
    }

    return reply.status(200).send(studyPlan);
}