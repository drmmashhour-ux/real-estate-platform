import { prisma } from "@/lib/db";
import { isEquityRole } from "./constants";

export async function createHolder(name: string, role: string) {
  if (!isEquityRole(role)) throw new Error(`Invalid role: ${role}`);
  return prisma.equityHolder.create({
    data: {
      name: name.trim(),
      role,
      equityPercent: 0,
    },
  });
}
