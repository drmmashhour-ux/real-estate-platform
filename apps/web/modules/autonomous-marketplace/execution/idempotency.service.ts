import { prisma } from "@/lib/db";
import { autonomyLog } from "../internal/autonomy-log";

export async function findRecentRunByIdempotencyKey(
  key: string,
  maxAgeMs: number,
): Promise<{ id: string; summaryJson: unknown } | null> {
  try {
    const since = new Date(Date.now() - maxAgeMs);
    const run = await prisma.autonomousMarketplaceRun.findFirst({
      where: {
        idempotencyKey: key,
        createdAt: { gte: since },
      },
      select: { id: true, summaryJson: true },
      orderBy: { createdAt: "desc" },
    });
    return run;
  } catch (e) {
    autonomyLog.info("idempotency lookup failed", { key, err: String(e) });
    return null;
  }
}
