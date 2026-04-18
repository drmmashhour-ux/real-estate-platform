import { getClosingReadiness } from "@/modules/closing/closing-readiness.service";
import { prisma } from "@/lib/db";

/**
 * Mirrors closing readiness flags into execution metadata for deposit/annex checks — broker still sets confirmations.
 */
export async function syncClosingReadinessToDealMetadata(dealId: string) {
  const r = await getClosingReadiness(dealId);
  const deal = await prisma.deal.findUnique({
    where: { id: dealId },
    select: { executionMetadata: true },
  });
  const meta = (deal?.executionMetadata ?? {}) as Record<string, unknown>;
  await prisma.deal.update({
    where: { id: dealId },
    data: {
      executionMetadata: {
        ...meta,
        closingReadinessSnapshot: {
          ready: r.ready,
          missingItems: r.missingItems,
          warnings: r.warnings,
          at: new Date().toISOString(),
        },
      } as object,
    },
  });
}
