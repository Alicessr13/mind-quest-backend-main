import { FastifyInstance } from "fastify";
import { postSignUp } from "./post-sign-up";
import { postSignIn } from "./post-sign-in";
import { patchRefreshToken } from "./patch-refresh-token";
import { validateToken } from "@/middlewares/validate-token";
import { postStudyPlan } from "./post-study-plan";

export async function routes(fastify: FastifyInstance) {
    fastify.get('/check', (_req, rep) => {
        return rep.status(200).send('Mind Quest API online!');
    });

    fastify.post('/sign-up', postSignUp);
    fastify.post('/sign-in', postSignIn);
    fastify.patch('/refresh-token', patchRefreshToken);
    fastify.post('/study-plan', { preHandler: validateToken }, postStudyPlan);
}
