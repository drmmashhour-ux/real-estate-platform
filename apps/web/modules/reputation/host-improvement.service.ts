import { computeListingQualityBundle } from "./listing-quality.service";
import { buildHostTrustSnapshot } from "@/modules/trust-scores/host-trust-score.service";

export type HostImprovementPlan = {
  listingId: string;
  qualityHighlights: string[];
  hostActions: string[];
  rankingLevers: string[];
};

/**
 * Actionable host guidance — safe copy for dashboards (no internal fraud labels).
 */
export async function buildHostImprovementPlan(listingId: string, hostUserId: string): Promise<HostImprovementPlan> {
  const [q, host] = await Promise.all([
    computeListingQualityBundle(listingId),
    buildHostTrustSnapshot(hostUserId),
  ]);

  const qualityHighlights: string[] = [];
  if (q.qualityScore >= 75) qualityHighlights.push("Listing quality is in a strong band for discovery.");
  else qualityHighlights.push(`Listing quality index is around ${q.qualityScore}/100 — room to climb.`);

  const hostActions = [...q.recommendations];
  if (host.reasons.some((r) => r.toLowerCase().includes("cancellation"))) {
    hostActions.push("Reduce cancellations — keep calendar accurate and use instant book when safe.");
  }
  if (host.hostTrustScore < 55) {
    hostActions.push("Improve response time and guest communication to lift host trust.");
  }

  const rankingLevers = [
    "Complete listing content and photos",
    "Earn verified badges where available",
    "Maintain competitive nightly pricing vs similar stays",
    "Deliver consistent 5-star guest experiences",
  ];

  return { listingId, qualityHighlights, hostActions, rankingLevers };
}
