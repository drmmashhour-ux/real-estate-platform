import { prisma } from "@/lib/db";
import type { ComplianceRulesetConfig } from "@/lib/trustgraph/domain/complianceRulesets";
import { isTrustGraphComplianceRulesetsEnabled, isTrustGraphEnabled } from "@/lib/trustgraph/feature-flags";

export async function resolveRulesetCodeForListing(listingId: string): Promise<string | null> {
  if (!isTrustGraphEnabled() || !isTrustGraphComplianceRulesetsEnabled()) return null;

  const listing = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: { city: true, address: true },
  });
  if (!listing) return null;

  const rulesets = await prisma.trustgraphComplianceRuleset.findMany();
  const city = listing.city.toLowerCase();
  for (const r of rulesets) {
    if (!r.regionPattern) continue;
    try {
      const re = new RegExp(r.regionPattern, "i");
      if (re.test(city) || re.test(listing.address)) return r.code;
    } catch {
      if (city.includes(r.regionPattern.toLowerCase())) return r.code;
    }
  }
  return rulesets.find((x) => x.code === "CA-DEFAULT")?.code ?? null;
}

export async function getRulesetConfig(code: string): Promise<ComplianceRulesetConfig | null> {
  const row = await prisma.trustgraphComplianceRuleset.findUnique({
    where: { code },
    select: { config: true },
  });
  if (!row?.config || typeof row.config !== "object") return null;
  return row.config as ComplianceRulesetConfig;
}
