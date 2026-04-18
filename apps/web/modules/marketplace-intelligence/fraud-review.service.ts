import { prisma } from "@/lib/db";
import { logWarn } from "@/lib/logger";
import * as repo from "./marketplace-intelligence.repository";

export type FraudReviewResolution = "CONFIRMED_SAFE" | "NEEDS_MORE_INFO" | "ESCALATED" | "DISMISSED";

/**
 * Operator queue — open fraud signals (audit-only; no automatic enforcement).
 */
export async function listOpenFraudReviewQueue() {
  return repo.getOpenFraudSignals();
}

/**
 * Mark a signal reviewed by setting `status` to the resolution label (audit trail preserved).
 */
export async function markFraudSignalReviewed(signalId: string, resolution: FraudReviewResolution) {
  try {
    return await prisma.listingFraudSignal.update({
      where: { id: signalId },
      data: {
        status: resolution,
      },
    });
  } catch (e) {
    logWarn("[marketplace-intelligence] markFraudSignalReviewed failed", { signalId, error: String(e) });
    throw e;
  }
}

export async function summarizeFraudRiskByListing(listingId: string) {
  const rows = await prisma.listingFraudSignal.findMany({
    where: { listingId, status: "OPEN" },
    orderBy: { createdAt: "desc" },
  });
  const bySeverity = { LOW: 0, MEDIUM: 0, HIGH: 0 };
  for (const r of rows) {
    const s = r.severity as keyof typeof bySeverity;
    if (s in bySeverity) bySeverity[s] += 1;
  }
  return {
    listingId,
    openCount: rows.length,
    bySeverity,
    highestConfidence: rows.length ? Math.max(...rows.map((x) => x.confidence)) : 0,
    latestReason: rows[0]?.reason ?? null,
  };
}
