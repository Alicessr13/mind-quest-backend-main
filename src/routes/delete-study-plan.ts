import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const paramsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export async function deleteStudyPlan(request: FastifyRequest, reply: FastifyReply) {
  const { id } = paramsSchema.parse(request.params);
  const { user_id } = request.user;

  const studyPlan = await prisma.studyPlan.findUnique({
    where: { study_plan_id: id },
    include: {
      Content: {
        include: {
          study_plan_day: true,
        },
      },
    },
  });

  if (!studyPlan) {
    return reply.status(404).send({ message: "Plano de estudo não encontrado." });
  }

  if (studyPlan.user_id !== user_id) {
    return reply.status(403).send({ message: "Acesso negado. Você não pode excluir este plano." });
  }

  await prisma.studyPlanDay.deleteMany({
    where: {
      content_id: { in: studyPlan.Content.map(c => c.content_id) },
    },
  });

  await prisma.content.deleteMany({
    where: {
      study_plan_id: +id,
    },
  });

  await prisma.studyPlan.delete({
    where: { study_plan_id: +id },
  });

  return reply.status(200).send({ message: "Plano de estudo excluído com sucesso." });
}
