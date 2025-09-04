import { FastifyReply, FastifyRequest } from "fastify";

export async function notFoundHandler(_request: FastifyRequest, reply: FastifyReply) {
    return reply.status(404).send({
        message: 'not found',
    });
}
