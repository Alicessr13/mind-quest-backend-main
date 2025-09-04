import { FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { AppError } from "@/errors/app-error";
import { hashPassword } from "@/lib/bcryptjs";

const bodySchema = z.object({
    name: z.string(),
    email: z.string().email(),
    password: z.string(),
});

export async function postSignUp(request: FastifyRequest, reply: FastifyReply) {
    const { name, email, password } = bodySchema.parse(request.body);

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (user) {
        throw new AppError('email already exists!', 409);
    }

    await prisma.user.create({
        data: {
            name,
            email,
            password_hash: hashPassword(password),
        },
    });

    return reply.status(201).send();
}
