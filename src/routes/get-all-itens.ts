import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "@/lib/prisma";

export async function getAllItems(request: FastifyRequest, reply: FastifyReply) {
    const { user_id } = request.user; // vem do JWT

    // busca todos os itens
    const items = await prisma.item.findMany({
        orderBy: { price: "asc" },
    });

    // busca o inventário do usuário
    const inventory = await prisma.inventory.findMany({
        where: { user_id },
        select: { item_id: true },
    });

    const ownedItemIds = new Set(inventory.map((i) => i.item_id));

    // adiciona flag purchased
    const itemsWithStatus = items.map((item) => ({
        ...item,
        purchased: ownedItemIds.has(item.item_id),
    }));

    return reply.status(200).send(itemsWithStatus);
}
