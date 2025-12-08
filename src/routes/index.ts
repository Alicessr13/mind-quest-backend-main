import { FastifyInstance } from "fastify";
import { postSignUp } from "./post-sign-up";
import { postSignIn } from "./post-sign-in";
import { patchRefreshToken } from "./patch-refresh-token";
import { validateToken } from "@/middlewares/validate-token";
import { postStudyPlan } from "./post-study-plan";
import { getAllStudyPlans } from "./get-all-study-plan";
import { getStudyPlanById } from "./get-study-plan-by-id";
import { getDailyStudyPlan } from "./get-daily-study-plan";
import { patchStudyPlanProgress } from "./patch-study-plan-progress";
import { getUser } from "./get-user";
import { postBuyItem } from "./post-buy-item";
import { postEquipItem } from "./post-equip-item";
import { getAllItems } from "./get-all-itens";
import { postUnequipItem } from "./post-unequip-item";
import { deleteStudyPlan } from "./delete-study-plan";
import { patchStudyPlanStatus } from "./patch-study-plan-status";

export async function routes(fastify: FastifyInstance) {
    fastify.get('/check', (_req, rep) => {
        return rep.status(200).send('Mind Quest API online!');
    });

    fastify.post('/sign-up', postSignUp);
    fastify.post('/sign-in', postSignIn);
    fastify.get('/user', { preHandler: validateToken }, getUser);
    fastify.patch('/refresh-token', patchRefreshToken);
    fastify.post('/study-plan', { preHandler: validateToken }, postStudyPlan);
    fastify.get('/study-plan', { preHandler: validateToken }, getAllStudyPlans);
    fastify.get('/study-plan/:id', { preHandler: validateToken }, getStudyPlanById);
    fastify.get('/study-plan/daily', { preHandler: validateToken }, getDailyStudyPlan);
    fastify.patch('/study-plan-day/:id/status', { preHandler: validateToken }, patchStudyPlanStatus);
    fastify.patch('/study-plan-day/:id/progress', { preHandler: validateToken }, patchStudyPlanProgress);
    fastify.get('/items', { preHandler: validateToken }, getAllItems);
    fastify.post('/users/:user_id/buy', { preHandler: validateToken }, postBuyItem);
    fastify.post('/users/:user_id/equip', { preHandler: validateToken }, postEquipItem);
    fastify.post('/users/:user_id/unequip', { preHandler: validateToken }, postUnequipItem);
    fastify.delete('/study-plan/:id', { preHandler: validateToken }, deleteStudyPlan);
}
