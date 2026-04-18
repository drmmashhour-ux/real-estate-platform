import { fraudTrustV1Flags } from "@/config/feature-flags";
import { prisma } from "@/lib/db";
import type { ProposedListingAutopilotAction } from "@/src/modules/autopilot/actions/listing.actions";
import type { ListingRuleHit } from "@/src/modules/autopilot/rules/listing.rules";
import { evaluateFsboListingTrust } from "./trust.engine";

/**
 * Safe FSBO autopilot nudges — never exposes fraud suspicion copy to owners; admin queue for high model risk.
 */
export async function proposeTrustFraudAutopilotActions(
  listingId: string,
  ruleHits: ListingRuleHit[],
): Promise<ProposedListingAutopilotAction[]> {
  if (!fraudTrustV1Flags.trustSystemV1) return [];

  const alreadyLowTrustRule = ruleHits.some((h) => h.ruleKey === "low_trust_score");

  const row = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: { riskScore: true },
  });
  const ev = await evaluateFsboListingTrust(listingId);

  const out: ProposedListingAutopilotAction[] = [];

  if (ev && ev.score < 42 && !alreadyLowTrustRule) {
    out.push({
      type: "suggest_verification_completion",
      domain: "listing",
      severity: "warning",
      riskLevel: "high",
      title: "Strengthen trust signals",
      description:
        "Trust score from observable account and listing completeness signals is below our recommended band — complete verification and media checks.",
      payload: { listingId, source: "trust_engine_v1", trustScore: ev.score },
    });
  }

  if (row?.riskScore != null && row.riskScore >= 72) {
    out.push({
      type: "queue_trust_safety_review",
      domain: "listing",
      severity: "critical",
      riskLevel: "high",
      title: "Scheduled for trust & safety review",
      description:
        "Internal risk signals suggest an admin should review this listing — this is not a public finding.",
      payload: { listingId, source: "trust_engine_v1", modelRiskScore: row.riskScore },
    });
  }

  return out;
}
