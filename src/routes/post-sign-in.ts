import { AppError } from "@/errors/app-error";
import { comparePassword } from "@/lib/bcryptjs";
import { prisma } from "@/lib/prisma";
import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";

const bodySchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

export async function postSignIn(request: FastifyRequest, reply: FastifyReply) {
    const { email, password } = bodySchema.parse(request.body);

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        throw new AppError("email or password incorrect!", 401);
    }

    const { user_id, created_at, name, password_hash } = user;

    if (!comparePassword(password, password_hash)) {
        throw new AppError("email or password incorrect!", 401);
    }

    const token = await reply.jwtSign({
        user_id,
        created_at,
        name,
        email,
    });

    const refresh_token = await reply.jwtSign({
        user_id,
        created_at,
        name,
        email,
    }, {
        sign: { expiresIn: '7d' },
    });

    reply.setCookie('refresh_token', refresh_token, {
        path: '/',
        secure: true,
        sameSite: true,
        httpOnly: true,
    });

    return reply.status(200).send({
        token,
        name,
    });
}
