import { FastifyReply, FastifyRequest } from "fastify";

export async function patchRefreshToken(request: FastifyRequest, reply: FastifyReply) {
    await request.jwtVerify({ onlyCookie: true });
    const token = await reply.jwtSign(request.user);
    const refresh_token = await reply.jwtSign(request.user, { expiresIn: '7d' });

    reply.setCookie('refresh_token', refresh_token, {
        path: '/',
        secure: true,
        sameSite: true,
        httpOnly: true,
    });

    return reply.status(200).send({
        token,
    });
}
