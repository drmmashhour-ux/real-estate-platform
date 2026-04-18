import { prisma } from "@/lib/db";

export async function listActiveNotaries() {
  return prisma.notary.findMany({
    where: { isActive: true },
    orderBy: { notaryName: "asc" },
  });
}

export async function getNotaryById(id: string) {
  return prisma.notary.findFirst({ where: { id, isActive: true } });
}
