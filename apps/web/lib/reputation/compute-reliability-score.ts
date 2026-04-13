import type { ReputationEntityType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { clampRepScore } from "@/lib/reputation/validators";

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

/** Completion / cancellation / dispute behavior → 0–100 */
export async function computeReliabilityScoreComponent(
  entityType: ReputationEntityType,
  entityId: string
): Promise<{ score: number; detail: Record<string, unknown> }> {
  if (entityType === "buyer") {
    const u = await prisma.user.findUnique({
      where: { id: entityId },
      select: { bnhubGuestTotalStays: true, bnhubGuestTrustScore: true },
    });
    if (u) {
      const stays = Math.min(30, u.bnhubGuestTotalStays ?? 0);
      const score = clampRepScore(48 + (stays / 30) * 28 + (u.bnhubGuestTrustScore / 100) * 18);
      return { score, detail: { stays, guestTrustSnapshot: u.bnhubGuestTrustScore } };
    }
    return { score: 52, detail: { source: "buyer_neutral" } };
  }

  if (entityType === "host" || entityType === "seller" || entityType === "broker") {
    const perf = await prisma.hostPerformance.findUnique({
      where: { hostId: entityId },
    });
    if (perf) {
      const comp = clamp01(perf.completionRate ?? 0.85);
      const canc = clamp01(1 - Math.min(1, (perf.cancellationRate ?? 0) * 3));
      const disp = clamp01(1 - Math.min(1, (perf.disputeRate ?? 0) * 4));
      const score = clampRepScore((comp * 0.45 + canc * 0.35 + disp * 0.2) * 100);
      return {
        score,
        detail: {
          completionRate: perf.completionRate,
          cancellationRate: perf.cancellationRate,
          disputeRate: perf.disputeRate,
        },
      };
    }
    return { score: 55, detail: { source: "neutral_no_host_perf" } };
  }

  if (entityType === "listing") {
    const [disputes, bookings] = await Promise.all([
      prisma.dispute.count({ where: { listingId: entityId } }),
      prisma.booking.count({
        where: { listingId: entityId, status: "COMPLETED" },
      }),
    ]);
    const dispPenalty = Math.min(40, disputes * 8);
    const base = 62 + Math.min(25, Math.log1p(bookings) * 4);
    return {
      score: clampRepScore(base - dispPenalty),
      detail: { completedBookings: bookings, disputeCount: disputes },
    };
  }

  return { score: 52, detail: { source: "default" } };
}
