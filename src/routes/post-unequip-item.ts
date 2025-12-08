import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { AppError } from "@/errors/app-error";
import { Slot } from "@prisma/client";

const bodySchema = z.object({
  slot: z.nativeEnum(Slot),
});

export async function postUnequipItem(request: FastifyRequest, reply: FastifyReply) {
  const { user_id } = request.user;
  const { slot } = bodySchema.parse(request.body);

  const updateData: any = {};

  switch (slot) {
    case Slot.Body:
      updateData.body = null;
      break;
    case Slot.Face:
      updateData.face = null;
      break;
    case Slot.SkinTop:
      updateData.skin_top = null;
      break;
    case Slot.SkinBottom:
      updateData.skin_bottom = null;
      break;
    case Slot.SkinTopAndBottom:
      updateData.skin_top = null;
      updateData.skin_bottom = null;
      break;
    case Slot.Shoes:
      updateData.shoes = null;
      break;
    case Slot.Hair:
      updateData.hair = null;
      break;
    case Slot.Accessory:
      updateData.accessory = null;
      break;
    case Slot.HandAccessory:
      updateData.hand_accessory = null;
      break;
    default:
      throw new AppError("Slot inválido", 400);
  }

  await prisma.user.update({
    where: { user_id },
    data: updateData,
  });

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
