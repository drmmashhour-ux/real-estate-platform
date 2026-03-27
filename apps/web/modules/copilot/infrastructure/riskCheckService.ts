import { prisma } from "@/lib/db";
import { getFsboListingTrustSummary } from "@/lib/fsbo/listing-trust-summary";
import { isTrustGraphEnabled } from "@/lib/trustgraph/config";

export async function runRiskCheck(args: { listingId: string }) {
  const listing = await prisma.fsboListing.findUnique({
    where: { id: args.listingId },
    select: {
      id: true,
      title: true,
      city: true,
      trustScore: true,
      riskScore: true,
      status: true,
      moderationStatus: true,
    },
  });
  if (!listing) return { ok: false as const, error: "Listing not found" };

  const tg = isTrustGraphEnabled() ? await getFsboListingTrustSummary(args.listingId) : null;

  const insights: string[] = [
    `Platform trust score (listing): ${listing.trustScore ?? "n/a"}`,
    `Platform risk score (heuristic): ${listing.riskScore ?? "n/a"}`,
  ];
  if (tg?.missingItems?.length) {
    for (const m of tg.missingItems.slice(0, 8)) {
      insights.push(`TrustGraph: ${m.message}`);
    }
  }
  if (tg?.readinessLevel) {
    insights.push(`Readiness signal: ${tg.readinessLevel}`);
  }

  return {
    ok: true as const,
    listing,
    insights,
    warnings: [
      "Risk labels are rules-based on platform data — not a legal or investment guarantee.",
    ],
  };
}
