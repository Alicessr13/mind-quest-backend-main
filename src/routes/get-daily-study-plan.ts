import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { startOfDay, endOfDay } from "date-fns";
import { Status } from "@prisma/client";

const querySchema = z.object({
  date: z.coerce.date().optional(), // se não passar, usa hoje
});

export async function getDailyStudyPlan(request: FastifyRequest, reply: FastifyReply) {
  const { user_id } = request.user;
  const { date } = querySchema.parse(request.query);

  const today = date ?? new Date();

  // Planos atrasados (antes de hoje e não concluídos)
  const overduePlans = await prisma.studyPlanDay.findMany({
    where: {
      date: { lt: startOfDay(today) },
      status: { not: Status.Completed && Status.InProgress },
      content: { study_plan: { user_id } },
    },
    include: {
      content: { select: { subject: true, study_plan_id: true } },
    },
  });

  // Planos de hoje
  const todayPlans = await prisma.studyPlanDay.findMany({
    where: {
      date: { gte: startOfDay(today), lte: endOfDay(today) },
      content: { study_plan: { user_id } },
    },
    include: {
      content: { select: { subject: true, study_plan_id: true } },
    },
  });

  // Planos em andamento (independente da data)
  const inProgressPlans = await prisma.studyPlanDay.findMany({
    where: {
      status: Status.InProgress,
      content: { study_plan: { user_id } },
    },
    include: {
      content: { select: { subject: true, study_plan_id: true } },
    },
  });

  return reply.status(200).send({
    overdue: overduePlans,
    today: todayPlans,
    inProgress: inProgressPlans,
  });
}