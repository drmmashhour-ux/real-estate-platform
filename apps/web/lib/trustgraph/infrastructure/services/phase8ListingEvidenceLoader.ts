import { prisma } from "@/lib/db";
import type { Phase8ListingEvidence } from "@/lib/trustgraph/domain/types";
import { isTrustGraphComplianceRulesetsEnabled, isTrustGraphEnabled } from "@/lib/trustgraph/feature-flags";
import { getRulesetConfig, resolveRulesetCodeForListing } from "@/lib/trustgraph/infrastructure/services/complianceRulesetService";

export async function loadPhase8ListingEvidence(listingId: string): Promise<Phase8ListingEvidence | undefined> {
  if (!isTrustGraphEnabled() || !isTrustGraphComplianceRulesetsEnabled()) return undefined;

  const listing = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: { description: true, city: true, address: true },
  });
  if (!listing) return { enabled: true, rulesetCode: null, missingRequirements: [] };

  const code = await resolveRulesetCodeForListing(listingId);
  const cfg = code ? await getRulesetConfig(code) : null;
  const missing: string[] = [];

  for (const f of cfg?.requiredFields ?? []) {
    if (f === "description" && !listing.description?.trim()) missing.push("description");
    if (f === "city" && !listing.city?.trim()) missing.push("city");
    if (f === "address" && !listing.address?.trim()) missing.push("address");
  }

  return {
    enabled: true,
    rulesetCode: code,
    missingRequirements: missing,
  };
}
