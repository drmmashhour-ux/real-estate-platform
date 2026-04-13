import type { Prisma, PrismaClient } from "@prisma/client";

type Db = PrismaClient | Prisma.TransactionClient;

export async function getActiveExperimentForSurface(
  db: Db,
  targetSurface: string,
  now: Date = new Date(),
) {
  return db.experiment.findFirst({
    where: {
      targetSurface,
      status: "running",
      archivedAt: null,
      AND: [{ OR: [{ startAt: null }, { startAt: { lte: now } }] }, { OR: [{ endAt: null }, { endAt: { gte: now } }] }],
    },
    orderBy: { createdAt: "desc" },
    include: { variants: true },
  });
}
