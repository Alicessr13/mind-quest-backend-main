import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { AppError } from "@/errors/app-error";

const bodySchema = z.object({
    item_id: z.number().int().positive(),
});

export async function postBuyItem(request: FastifyRequest, reply: FastifyReply) {
    const { user_id } = request.user;
    const { item_id } = bodySchema.parse(request.body);

    const user = await prisma.user.findUnique({ where: { user_id } });
    const item = await prisma.item.findUnique({ where: { item_id } });

    if (!item) throw new AppError("Item não encontrado", 404);
    if (!user || user.points < item.price) throw new AppError("Pontos insuficientes", 403);

    await prisma.user.update({
        where: { user_id },
        data: { points: { decrement: item.price } },
    });

    await prisma.inventory.create({
        data: { user_id, item_id },
    });

    // 🔹 Retornar usuário atualizado com inventário
    const updatedUser = await prisma.user.findUnique({
        where: { user_id },
        include: { Inventory: { include: { item: true } } }
    });

    return reply.status(200).send(updatedUser);
}