import { FastifyReply, FastifyRequest } from "fastify";
import { AppError } from "@/errors/app-error";

export async function validateToken(request: FastifyRequest, reply: FastifyReply) {
    try {
        await request.jwtVerify();
    } catch (error) {
        throw new AppError('invalid token!', 401);
    }
}
