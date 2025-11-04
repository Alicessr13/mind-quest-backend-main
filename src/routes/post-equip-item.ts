import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { AppError } from "@/errors/app-error";
import { Slot } from "@prisma/client";

const bodySchema = z.object({
    item_id: z.number().int().positive(),
});

export async function postEquipItem(request: FastifyRequest, reply: FastifyReply) {
    const { user_id } = request.user;
    const { item_id } = bodySchema.parse(request.body);

    const item = await prisma.item.findUnique({ where: { item_id } });
    if (!item) throw new AppError("Item não encontrado", 404);

    const inventory = await prisma.inventory.findFirst({
        where: { user_id, item_id },
    });
    if (!inventory) throw new AppError("Usuário não possui esse item!", 403);

    // Atualiza o campo correto dependendo do slot
    switch (item.slot) {
        case Slot.Body:
            await prisma.user.update({ where: { user_id }, data: { body: item_id } });
            break;
        case Slot.Face:
            await prisma.user.update({ where: { user_id }, data: { face: item_id } });
            break;
        case Slot.SkinTop:
            await prisma.user.update({ where: { user_id }, data: { skin_top: item_id } });
            break;
        case Slot.SkinBottom:
            await prisma.user.update({ where: { user_id }, data: { skin_bottom: item_id } });
            break;
        case Slot.SkinTopAndBottom:
            await prisma.user.update({
                where: { user_id },
                data: { skin_top: item_id, skin_bottom: item_id },
            });
            break;
        case Slot.Shoes:
            await prisma.user.update({ where: { user_id }, data: { shoes: item_id } });
            break;
        case Slot.Hair:
            await prisma.user.update({ where: { user_id }, data: { hair: item_id } });
            break;
        case Slot.Accessory:
            await prisma.user.update({ where: { user_id }, data: { accessory: item_id } });
            break;
        case Slot.HandAccessory:
            await prisma.user.update({ where: { user_id }, data: { hand_accessory: item_id } });
            break;
        default:
            throw new AppError("Slot inválido", 400);
    }

    // 🔹 Buscar o usuário atualizado com os relacionamentos
    const updatedUser = await prisma.user.findUnique({
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
            Inventory: { include: { item: true } },
        },
    });

    return reply.status(200).send(updatedUser);
}
