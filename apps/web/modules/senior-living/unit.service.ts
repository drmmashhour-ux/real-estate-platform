import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function upsertUnits(
  residenceId: string,
  units: Array<{ type: string; price?: number | null; available?: boolean }>
): Promise<number> {
  await prisma.seniorResidenceUnit.deleteMany({ where: { residenceId } });
  if (units.length === 0) return 0;

  await prisma.seniorResidenceUnit.createMany({
    data: units.map((u) => ({
      residenceId,
      type: u.type.slice(0, 32),
      price: u.price ?? undefined,
      available: u.available ?? true,
    })),
  });
  return units.length;
}

export async function listUnits(residenceId: string) {
  return prisma.seniorResidenceUnit.findMany({
    where: { residenceId },
    orderBy: { type: "asc" },
  });
}
