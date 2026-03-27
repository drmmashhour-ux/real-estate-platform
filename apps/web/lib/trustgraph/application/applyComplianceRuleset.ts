import { resolveRulesetCodeForListing, getRulesetConfig } from "@/lib/trustgraph/infrastructure/services/complianceRulesetService";

export async function applyComplianceRulesetForListing(listingId: string) {
  const code = await resolveRulesetCodeForListing(listingId);
  const config = code ? await getRulesetConfig(code) : null;
  return { rulesetCode: code, config };
}
