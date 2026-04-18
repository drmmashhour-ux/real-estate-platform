/**
 * Optional append-only trust/ranking snapshots for auditability.
 * Fire-and-forget: never blocks request path; errors are logged only.
 * Does not replace live computation — tables are not read for runtime ranking/reputation.
 */
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { reputationEngineFlags } from "@/config/feature-flags";
import { recordRankingSnapshotFromExplanation } from "@/modules/ranking/ranking-snapshot.service";
import { computeReputationRankingForListing } from "@/modules/ranking/ranking-engine.service";
import type { UnifiedRankingExplanation } from "@/modules/ranking/ranking-factors.service";
import type { GuestTrustSnapshot } from "@/modules/trust-scores/guest-trust-score.service";
import type { HostTrustSnapshot } from "@/modules/trust-scores/host-trust-score.service";

function logSnapshot(context: string, err: unknown): void {
  console.warn(`[snapshot-writer] ${context}`, err instanceof Error ? err.message : err);
}

/**
 * Persist unified ranking explanation (same shape as admin audit). Gated by reputation engine flag inside ranking-snapshot service.
 */
export function schedulePersistListingRankingSnapshot(listingId: string, explanation: UnifiedRankingExplanation): void {
  if (!reputationEngineFlags.reputationEngineV1) return;
  void (async () => {
    try {
      await recordRankingSnapshotFromExplanation(listingId, explanation);
    } catch (e) {
      logSnapshot(`ranking_snapshot listingId=${listingId}`, e);
    }
  })();
}

/**
 * After ranked search — persist a small sample of unified explanations (async; capped to limit extra compute).
 */
export function schedulePersistSearchRankingSnapshots(listingIds: string[], maxSamples = 6): void {
  if (!reputationEngineFlags.reputationEngineV1 || !reputationEngineFlags.rankingEngineV1) return;
  const slice = listingIds.slice(0, maxSamples);
  if (slice.length === 0) return;
  void (async () => {
    for (const listingId of slice) {
      try {
        const ex = await computeReputationRankingForListing(listingId);
        if (ex) await recordRankingSnapshotFromExplanation(listingId, ex);
      } catch (e) {
        logSnapshot(`search_ranking_snapshot listingId=${listingId}`, e);
      }
    }
  })();
}

function trustFactorsPayload(trust: HostTrustSnapshot | GuestTrustSnapshot): Prisma.InputJsonValue {
  const base = {
    subscores: trust.factors,
    reasonsSample: trust.reasons.slice(0, 16),
    penalties: trust.penalties,
    riskAdjustments: trust.riskAdjustments,
  };
  if ("hostTrustScore" in trust) {
    return { kind: "host" as const, ...base };
  }
  return { kind: "guest" as const, ...base };
}

export function schedulePersistHostTrustSnapshot(hostUserId: string, trust: HostTrustSnapshot): void {
  if (!reputationEngineFlags.reputationEngineV1) return;
  void (async () => {
    try {
      await prisma.hostTrustScoreSnapshot.create({
        data: {
          hostUserId,
          trustScore: trust.hostTrustScore,
          factors: trustFactorsPayload(trust),
        },
      });
    } catch (e) {
      logSnapshot(`host_trust_snapshot userId=${hostUserId}`, e);
    }
  })();
}

export function schedulePersistGuestTrustSnapshot(guestUserId: string, trust: GuestTrustSnapshot): void {
  if (!reputationEngineFlags.reputationEngineV1) return;
  void (async () => {
    try {
      await prisma.guestTrustScoreSnapshot.create({
        data: {
          guestUserId,
          trustScore: trust.guestTrustScore,
          factors: trustFactorsPayload(trust),
        },
      });
    } catch (e) {
      logSnapshot(`guest_trust_snapshot userId=${guestUserId}`, e);
    }
  })();
}
