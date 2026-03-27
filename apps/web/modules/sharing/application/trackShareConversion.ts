import type { PrismaClient } from "@prisma/client";

export async function recordShareConversion(db: PrismaClient, token: string): Promise<void> {
  await db.publicShareLink.updateMany({
    where: { token },
    data: { conversionCount: { increment: 1 } },
  });
}
