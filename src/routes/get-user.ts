import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "@/lib/prisma";

export async function getUser(request: FastifyRequest, reply: FastifyReply) {
  // request.user é preenchido pelo middleware validateToken
  const { user_id } = request.user;

  const user = await prisma.user.findUnique({
    where: { user_id },
    select: {
      user_id: true,
      name: true,
      email: true,
      created_at: true,
    },
  });

  if (!user) {
    return reply.status(404).send({ message: "Usuário não encontrado" });
  }

  return reply.status(200).send(user);
}