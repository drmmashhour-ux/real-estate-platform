import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { isFsboPubliclyVisible } from "@/lib/fsbo/constants";
import { cityToSlug } from "@/lib/market/slug";
import { isDealAnalyzerEnabled } from "@/modules/deal-analyzer/config";
import { getDealAnalysisPublicDto } from "@/modules/deal-analyzer/application/getDealAnalysis";
import { getBrokerEntitlementsForUser } from "@/modules/subscription/application/getBrokerEntitlements";
import { getSiteBaseUrl } from "@/modules/seo/lib/siteBaseUrl";
import { breadcrumbJsonLd, listingAnalysisJsonLd } from "@/modules/seo/infrastructure/jsonLd";
import { AIInsightsPanel } from "@/components/ai/AIInsightsPanel";
import { AICopilotChat } from "@/components/ai/AICopilotChat";
import { DealExplainerCard } from "@/components/ai/DealExplainerCard";
import { SaveToWatchlistButton } from "@/src/modules/watchlist-alerts/ui/SaveToWatchlistButton";
import { TrustDealSummaryCard } from "@/components/conversion/TrustDealSummaryCard";
import { RecommendationBanner } from "@/components/conversion/RecommendationBanner";
import { KeyIssuesChecklist } from "@/components/conversion/KeyIssuesChecklist";
import { OpportunityHighlights } from "@/components/conversion/OpportunityHighlights";
import { NextActionPanel } from "@/components/conversion/NextActionPanel";
import { LockedInsightPreview } from "@/components/conversion/LockedInsightPreview";
import { UpgradePromptCard } from "@/components/conversion/UpgradePromptCard";
import { UrgencyBadge } from "@/components/conversion/UrgencyBadge";
import { conversionCopy } from "@/src/design/conversionCopy";
import { selectStrategy } from "@/src/modules/ai-selection-engine/application/selectStrategy";
import { selectBestActions } from "@/src/modules/ai-selection-engine/application/selectBestActions";
import { ActionRecommendationCard } from "@/src/modules/ai-selection-engine/ui/ActionRecommendationCard";
import { aggregateListingIntelligence } from "@/src/core/intelligence/aggregation/aggregationEngine";

export const revalidate = 3600;

type Props = { params: Promise<{ city: string; listingId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city, listingId } = await params;
  const listing = await prisma.fsboListing.findUnique({
    where: { id: listingId },
    select: { city: true, address: true, title: true, priceCents: true },
  });
  if (!listing || cityToSlug(listing.city) !== city) {
    return { title: "Property analysis" };
  }
  const title = `Is ${listing.title} a good deal? — ${listing.city} | LECIPM`;
  const desc = `Investment-style analysis: trust, deal signals, and ROI context for a property in ${listing.city}. Not financial advice.`;
  const url = `${getSiteBaseUrl()}/analysis/${city}/${listingId}`;
  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: { title, description: desc, url, type: "article" },
    robots: { index: true, follow: true },
  };
}

function trustBand(score: number | null): string {
  if (score == null) return "—";
  if (score >= 70) return "High";
  if (score >= 45) return "Medium";
  return "Low";
}

function confidenceFromDeal(deal: Awaited<ReturnType<typeof getDealAnalysisPublicDto>>): "low" | "medium" | "high" {
  if (!deal) return "low";
  if (deal.confidenceLevel === "high") return "high";
  if (deal.confidenceLevel === "medium") return "medium";
  return "low";
}

function recommendationFromConfidence(confidence: "low" | "medium" | "high"): string {
  if (confidence === "high") return conversionCopy.analysis.recommendationHigh;
  if (confidence === "medium") return conversionCopy.analysis.recommendationMedium;
  return conversionCopy.analysis.recommendationLow;
}

function explanationLevel(score: number | null): "high" | "medium" | "low" {
  if ((score ?? 0) >= 75) return "high";
  if ((score ?? 0) >= 55) return "medium";
  return "low";
}

function confidencePercentFromBand(confidence: "low" | "medium" | "high"): number {
  if (confidence === "high") return 85;
  if (confidence === "medium") return 62;
  return 40;
}

function confidenceExplanationFromBand(confidence: "low" | "medium" | "high"): string {
  if (confidence === "high") {
    return "Signals are broadly aligned; still verify listing-specific documents before committing.";
  }
  if (confidence === "medium") {
    return "Evidence is mixed or incomplete — stress-test assumptions and comparables before a firm bid.";
  }
  return "Thin or conflicting evidence — treat headline scores as directional, not definitive.";
}

export default async function ListingAnalysisSeoPage({ params }: Props) {
  const { city: cityParam, listingId } = await params;
  const listing = await prisma.fsboListing.findUnique({
    where: { id: listingId },
  });
  if (!listing || !isFsboPubliclyVisible(listing)) notFound();

  const slug = cityToSlug(listing.city);
  if (slug !== cityParam) {
    redirect(`/analysis/${slug}/${listingId}`);
  }

  const userId = await getGuestId();
  const unlocked = Boolean(userId);
  let premiumInsights = false;
  if (userId) {
    const ent = await getBrokerEntitlementsForUser(prisma, userId);
    premiumInsights = ent.premiumInsights;
  }

  const base = getSiteBaseUrl();
  const pageUrl = `${base}/analysis/${slug}/${listingId}`;
  const nextPath = `/analysis/${slug}/${listingId}`;

  const deal = isDealAnalyzerEnabled() ? await getDealAnalysisPublicDto(listingId) : null;
  const trustScore = listing.trustScore;
  const level = explanationLevel(deal?.investmentScore ?? null);
  const dealConf = deal ? confidenceFromDeal(deal) : "low";
  const explainerText =
    deal?.reasons?.length || deal?.warnings?.length
      ? `${recommendationFromConfidence(dealConf)}. ${
          deal?.reasons?.[0] ? `Reason: ${deal.reasons[0]}. ` : ""
        }${deal?.warnings?.[0] ? `Watchout: ${deal.warnings[0]}.` : ""}`.trim()
      : null;
  const explainerExpanded =
    deal?.reasons?.[1] || deal?.warnings?.[1]
      ? [deal?.reasons?.[1], deal?.warnings?.[1]].filter(Boolean).join(" ")
      : null;
  const intelligence = aggregateListingIntelligence({
    cacheKey: `analysis:${listingId}`,
    input: {
      priceCents: listing.priceCents,
      trustScore: listing.trustScore ?? null,
      riskScore: deal?.riskScore ?? listing.riskScore ?? null,
      freshnessDays: Math.max(0, Math.floor((Date.now() - listing.updatedAt.getTime()) / 86_400_000)),
      rentalDemand: listing.listingDealType === "RENT_SHORT" ? 80 : 58,
    },
  });
  const [strategySelection] = await Promise.all([selectStrategy(listingId)]);
  const actionSelection = selectBestActions({
    id: listingId,
    type: "property",
    score: deal?.investmentScore ?? null,
    trustScore: listing.trustScore ?? null,
    riskScore: deal?.riskScore ?? listing.riskScore ?? null,
    confidence: confidencePercentFromBand(dealConf),
    status: listing.status,
  });

  const productLd = listingAnalysisJsonLd({
    url: pageUrl,
    name: listing.title,
    description: `Property analysis for ${listing.address}, ${listing.city}.`,
    city: listing.city,
    priceCents: listing.priceCents,
  });
  const crumbLd = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: listing.city, path: `/market/${slug}` },
    { name: "Analysis", path: `/analysis/${slug}/${listingId}` },
  ]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbLd) }} />

      <Link href={`/market/${slug}`} className="text-sm text-slate-500 hover:underline">
        ← {listing.city} market
      </Link>
      <Link href={`/sell/${listingId}`} className="ml-4 text-sm text-slate-500 hover:underline">
        View listing
      </Link>

      <h1 className="mt-4 text-2xl font-semibold text-slate-900 dark:text-white">{conversionCopy.analysis.header}</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
        {listing.address}, {listing.city}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900/40">
          <section>
          <h2 className="text-lg font-medium text-slate-900 dark:text-white">{conversionCopy.analysis.propertyPanelTitle}</h2>
          {unlocked ? (
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              Listing trust score (0–100): <strong>{trustScore ?? "—"}</strong>. Rules-based signal — not a legal warranty.
            </p>
          ) : (
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
              Trust signal band: <strong>{trustBand(trustScore)}</strong> (exact score is visible after sign-in). Not a legal
              warranty.
            </p>
          )}
          </section>

          {deal ? (
            <section>
            <h2 className="text-lg font-medium text-slate-900 dark:text-white">{conversionCopy.analysis.dealScoreLabel}</h2>
            {unlocked ? (
              <>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700 dark:text-slate-300">
                  <li>{conversionCopy.analysis.dealScoreLabel}: {deal.investmentScore}</li>
                  <li>Risk score: {deal.riskScore}</li>
                  <li>Recommendation: {deal.recommendation}</li>
                  {deal.scenarioPreview?.annualRoiPercent != null ? (
                    <li>Illustrative annual ROI: {deal.scenarioPreview.annualRoiPercent}%</li>
                  ) : null}
                  {deal.scenarioPreview?.capRatePercent != null ? (
                    <li>Cap rate (scenario): {deal.scenarioPreview.capRatePercent}%</li>
                  ) : null}
                </ul>
                <div className="mt-4">
                  {(() => {
                    const conf = confidenceFromDeal(deal);
                    return (
                  <RecommendationBanner
                    recommendation={recommendationFromConfidence(conf)}
                    confidence={conf}
                  />
                    );
                  })()}
                </div>
                {premiumInsights ? (
                  <p className="mt-3 text-xs text-slate-500">
                    Pro / Platinum: broker CRM prioritizes high-scoring leads like this — upgrade in the broker dashboard.
                  </p>
                ) : null}
                <p className="mt-3 text-xs text-slate-500">{deal.disclaimer}</p>
              </>
            ) : (
              <div className="mt-3 rounded-lg border border-dashed border-slate-300 p-4 dark:border-white/20">
                <p className="text-sm text-slate-700 dark:text-slate-300">
                  ROI, cap-rate context, and numeric investment scores are unlocked when you create a free account — so we can
                  personalize the experience and reduce scraping.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href={`/auth/signup?next=${encodeURIComponent(nextPath)}`}
                    className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 dark:bg-premium-gold dark:text-black dark:hover:bg-premium-gold"
                  >
                    Create free account
                  </Link>
                  <Link
                    href={`/auth/login?next=${encodeURIComponent(nextPath)}`}
                    className="inline-flex rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 dark:border-white/20 dark:text-white dark:hover:bg-white/10"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            )}
            </section>
          ) : (
            <p className="text-sm text-slate-500">Deal analyzer output is not available for this listing.</p>
          )}

          <KeyIssuesChecklist items={deal?.warnings ?? []} title={conversionCopy.analysis.keyIssues} />
          <OpportunityHighlights items={deal?.reasons ?? []} title={conversionCopy.analysis.opportunities} />
          <NextActionPanel
            title={conversionCopy.analysis.nextAction}
            body="Use this decision snapshot to contact the seller, verify risk flags, or compare alternatives."
            ctaHref={`/sell/${listingId}`}
            ctaLabel={conversionCopy.ctas.analysisActions[0]}
            secondaryHref={unlocked ? "/dashboard/leads" : `/auth/signup?next=${encodeURIComponent(nextPath)}`}
            secondaryLabel={unlocked ? conversionCopy.ctas.analysisActions[1] : "Create free account"}
          />
        </div>

        <aside className="space-y-4">
          <ActionRecommendationCard result={actionSelection} />
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-wide text-premium-gold">Strategy signal</p>
            <p className="mt-2 text-sm font-semibold text-white">{strategySelection.strategy.replace(/_/g, " ")}</p>
            <p className="mt-1 text-xs text-slate-400">{strategySelection.reasons[0]}</p>
            <p className="mt-1 text-xs text-slate-500">Score {strategySelection.score} · Confidence {strategySelection.confidence}%</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <p className="mb-2 text-xs uppercase tracking-wide text-slate-500">Watchlist</p>
            <SaveToWatchlistButton listingId={listingId} />
            <a href="/watchlist" className="mt-2 inline-flex text-xs text-premium-gold hover:underline">
              Open alerts center
            </a>
          </div>
          <TrustDealSummaryCard
            trustScore={trustScore}
            dealScore={deal?.investmentScore ?? null}
            confidence={confidenceFromDeal(deal)}
            reasons={deal?.reasons ?? []}
          />
          {deal ? (
            <DealExplainerCard
              explanationText={explainerText}
              expandedExplanationText={explainerExpanded}
              reasons={deal.reasons}
              warnings={deal.warnings}
              recommendation={recommendationFromConfidence(dealConf)}
              scoreLevel={level}
              confidencePercent={confidencePercentFromBand(dealConf)}
              confidenceExplanation={intelligence.explanation.short || confidenceExplanationFromBand(dealConf)}
              dealScore={deal.investmentScore}
              trustScore={trustScore}
              baseRoiPercent={deal.scenarioPreview?.annualRoiPercent ?? null}
              roiDisclaimer={deal.disclaimer}
              factorDataSourceLabel="Deal analyzer output + listing trust signals"
              contactHref={`/sell/${listingId}#contact`}
              requestInfoHref={`/sell/${listingId}#documents`}
              saveHref={`/dashboard/leads?listingId=${listingId}`}
              analyzeDeeperHref={
                unlocked
                  ? `/dashboard/leads?listingId=${listingId}`
                  : `/auth/signup?next=${encodeURIComponent(nextPath)}`
              }
            />
          ) : (
            <DealExplainerCard
              explanationText={explainerText}
              recommendation={recommendationFromConfidence("low")}
              scoreLevel="low"
              confidencePercent={40}
              confidenceExplanation={confidenceExplanationFromBand("low")}
              dealScore={null}
              trustScore={trustScore}
              contactHref={`/sell/${listingId}#contact`}
              requestInfoHref={`/sell/${listingId}#documents`}
              saveHref={`/dashboard/leads?listingId=${listingId}`}
              analyzeDeeperHref={
                unlocked
                  ? `/dashboard/leads?listingId=${listingId}`
                  : `/auth/signup?next=${encodeURIComponent(nextPath)}`
              }
            />
          )}
          <div className="rounded-xl border border-white/10 bg-black/30 p-4">
            <p className="text-xs uppercase tracking-wide text-premium-gold">{conversionCopy.analysis.confidenceLabel}</p>
            <div className="mt-2">
              <UrgencyBadge
                level={(deal?.investmentScore ?? 0) >= 75 ? "high" : (deal?.investmentScore ?? 0) >= 55 ? "medium" : "early"}
                label={confidenceFromDeal(deal) === "low" ? conversionCopy.analysis.recommendationLow : conversionCopy.analysis.recommendationHigh}
              />
            </div>
          </div>
          {!premiumInsights ? (
            <LockedInsightPreview
              title={conversionCopy.upgrade.lockedPrompt}
              previewPoints={[
                "Scenario-level ROI stress testing",
                "Lead conversion probability view",
                "Comparables confidence decomposition",
              ]}
            />
          ) : null}
          {!premiumInsights ? <UpgradePromptCard role="broker" /> : null}
        </aside>
      </div>
      <AIInsightsPanel listingId={listingId} />
      <div className="mt-6">
        <AICopilotChat listingId={listingId} />
      </div>
    </main>
  );
}
