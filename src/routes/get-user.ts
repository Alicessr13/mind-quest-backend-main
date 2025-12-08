import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "@/lib/prisma";

export async function getUser(request: FastifyRequest, reply: FastifyReply) {
    // request.user é preenchido pelo middleware validateToken
    const { user_id } = request.user;

    const user = await prisma.user.findUnique({
        where: { user_id },
        include: {
            item_body: true,
            item_face: true,
            item_skin_top: true,
            item_skin_bottom: true,
            item_shoes: true,
            item_hair: true,
            item_accessory: true,
            item_hand_accessory: true,
            Inventory: {
                include: { item: true }
            }
        }
    });

    if (!user) {
        return reply.status(404).send({ message: "Usuário não encontrado" });
    }

    return reply.status(200).send(user);
}