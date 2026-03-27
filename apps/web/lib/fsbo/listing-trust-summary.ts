import { prisma } from "@/lib/db";
import { isTrustGraphEnabled } from "@/lib/trustgraph/config";

export type ListingTrustApiBlock = {
  caseId: string | null;
  overallScore: number | null;
  trustLevel: string | null;
  readinessLevel: string | null;
  /** Failed rule rows — safe strings only */
  missingItems: { ruleCode: string; message: string }[];
  /** Mirrors FSBO listing columns */
  listingTrustScore: number | null;
  listingRiskScore: number | null;
  aiReasons: string[];
};

function ruleMessage(details: unknown, ruleCode: string, passed: boolean): string {
  if (passed) return `${ruleCode} passed`;
  const d = details && typeof details === "object" ? (details as Record<string, unknown>) : {};
  const msg = typeof d.message === "string" ? d.message.trim() : "";
  return msg || `Rule ${ruleCode} did not pass`;
}

/**
 * TrustGraph + listing snapshot for API responses (owner/admin).
 */
export async function getFsboListingTrustSummary(listingId: string): Promise<ListingTrustApiBlock | null> {
  const listing = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: { trustScore: true, riskScore: true, aiScoreReasonsJson: true },
  });
  if (!listing) return null;

  if (!isTrustGraphEnabled()) {
    const aiReasons = Array.isArray(listing.aiScoreReasonsJson)
      ? listing.aiScoreReasonsJson.filter((x): x is string => typeof x === "string")
      : [];
    return {
      caseId: null,
      overallScore: null,
      trustLevel: null,
      readinessLevel: null,
      missingItems: [],
      listingTrustScore: listing.trustScore,
      listingRiskScore: listing.riskScore,
      aiReasons,
    };
  }

  const caseRow = await prisma.verificationCase.findFirst({
    where: { entityType: "LISTING", entityId: listingId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      overallScore: true,
      trustLevel: true,
      readinessLevel: true,
    },
  });

  const rules = caseRow
    ? await prisma.verificationRuleResult.findMany({
        where: { caseId: caseRow.id, passed: false },
        orderBy: { createdAt: "asc" },
        select: { ruleCode: true, passed: true, details: true },
      })
    : [];

  const aiReasons = Array.isArray(listing.aiScoreReasonsJson)
    ? listing.aiScoreReasonsJson.filter((x): x is string => typeof x === "string")
    : [];

  return {
    caseId: caseRow?.id ?? null,
    overallScore: caseRow?.overallScore ?? null,
    trustLevel: caseRow?.trustLevel != null ? String(caseRow.trustLevel) : null,
    readinessLevel: caseRow?.readinessLevel != null ? String(caseRow.readinessLevel) : null,
    missingItems: rules.map((r) => ({
      ruleCode: r.ruleCode,
      message: ruleMessage(r.details, r.ruleCode, r.passed),
    })),
    listingTrustScore: listing.trustScore,
    listingRiskScore: listing.riskScore,
    aiReasons,
  };
}
