import { prisma } from "@/lib/db";
import { runDealAnalysis } from "@/modules/deal-analyzer/application/runDealAnalysis";
import { isDealAnalyzerEnabled } from "@/modules/deal-analyzer/config";

const MAX_AUTO_RUN = 12;

/**
 * Ensures each listing has at least one persisted Deal Analysis so ranking is grounded in the same deterministic engine.
 * Does not override scores — only fills gaps.
 */
export async function ensureDealAnalysesForListings(listingIds: string[]): Promise<{ ran: number; skipped: number }> {
  if (!isDealAnalyzerEnabled()) return { ran: 0, skipped: listingIds.length };

  let ran = 0;
  let skipped = 0;
  for (const id of listingIds.slice(0, MAX_AUTO_RUN)) {
    const latest = await prisma.dealAnalysis.findFirst({
      where: { propertyId: id },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (latest) {
      skipped += 1;
      continue;
    }
    const out = await runDealAnalysis({ listingId: id, analysisType: "listing" });
    if (out.ok) ran += 1;
    else skipped += 1;
  }
  return { ran, skipped };
}
