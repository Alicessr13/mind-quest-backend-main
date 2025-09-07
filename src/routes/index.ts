import { FastifyInstance } from "fastify";
import { postSignUp } from "./post-sign-up";
import { postSignIn } from "./post-sign-in";
import { patchRefreshToken } from "./patch-refresh-token";
import { validateToken } from "@/middlewares/validate-token";
import { postStudyPlan } from "./post-study-plan";
import { getAllStudyPlans } from "./get-all-study-plan";
import { getStudyPlanById } from "./get-study-plan-by-id";
import { getDailyStudyPlan } from "./get-daily-study-plan";
import { patchStudyPlanDayProgress } from "./patch-update-study-plan";
import { getUser } from "./get-user";

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
    fastify.patch('/study-plan-day/:id/progress', { preHandler: validateToken }, patchStudyPlanDayProgress);
}
