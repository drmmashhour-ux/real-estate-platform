import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import {
  StarRatingBadge,
  LuxuryTierBadge,
  TrustScoreCard,
  TierUpgradeCard,
  PricingRecommendationCard,
} from "@/components/bnhub/quality/BnhubQualityKit";
import { HostBnhubRatingPanel } from "@/components/bnhub/HostBnhubRatingPanel";
import type { ClassificationBreakdown } from "@/src/modules/bnhub-growth-engine/services/propertyClassificationService";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ listingId: string }> }) {
  const userId = await getGuestId();
  if (!userId) redirect("/login");
  const { listingId } = await params;

  const listing = await prisma.shortTermListing.findUnique({
    where: { id: listingId },
    select: { id: true, ownerId: true, title: true },
  });
  if (!listing || listing.ownerId !== userId) notFound();

  const [clsRow, tier, trust, pricing] = await Promise.all([
    prisma.bnhubPropertyClassification.findUnique({ where: { listingId } }),
    prisma.bnhubLuxuryTier.findUnique({ where: { listingId } }),
    prisma.bnhubTrustProfile.findUnique({ where: { listingId } }),
    prisma.bnhubDynamicPricingProfile.findUnique({ where: { listingId } }),
  ]);

  const breakdown =
    clsRow?.breakdownJson && typeof clsRow.breakdownJson === "object"
      ? (clsRow.breakdownJson as ClassificationBreakdown)
      : null;

  const tierSuggestions =
    tier?.breakdownJson &&
    typeof tier.breakdownJson === "object" &&
    tier.breakdownJson !== null &&
    "suggestions" in tier.breakdownJson &&
    Array.isArray((tier.breakdownJson as { suggestions: string[] }).suggestions)
      ? (tier.breakdownJson as { suggestions: string[] }).suggestions
      : [];

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-50">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/bnhub/host/quality" className="text-sm text-emerald-400">
          ← Quality hub
        </Link>
        <h1 className="text-xl font-semibold">{listing.title}</h1>

        <HostBnhubRatingPanel breakdown={breakdown} />

        <div className="flex flex-wrap gap-2">
          {clsRow ? <StarRatingBadge stars={clsRow.starRating} label="Internal estimate" /> : null}
          {tier ? <LuxuryTierBadge code={tier.tierCode} /> : null}
        </div>

        {trust ? (
          <TrustScoreCard
            trustScore={trust.trustScore}
            riskLevel={trust.overallRiskLevel}
            safeMessage="If something needs attention, we’ll prompt you to add information — we don’t make legal guarantees about safety."
          />
        ) : null}

        {tierSuggestions.length > 0 ? <TierUpgradeCard suggestions={tierSuggestions} /> : null}

        {pricing ? (
          <PricingRecommendationCard
            recommendedUsd={Number(pricing.recommendedPrice).toFixed(2)}
            minUsd={Number(pricing.minPrice).toFixed(2)}
            maxUsd={Number(pricing.maxPrice).toFixed(2)}
            confidence={pricing.confidenceScore}
            note="This is a pricing recommendation, not a mandate. Autoprice apply is off unless the platform explicitly enables it."
          />
        ) : null}
      </div>
    </main>
  );
}
