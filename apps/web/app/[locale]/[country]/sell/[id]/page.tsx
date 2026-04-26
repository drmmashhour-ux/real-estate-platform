import Link from "next/link";
import { notFound } from "next/navigation";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { isFsboPubliclyVisible } from "@/lib/fsbo/constants";
import { FsboContactOwnerForm } from "@/components/fsbo/FsboContactOwnerForm";
import { FsboListingGallery } from "@/components/fsbo/FsboListingGallery";
import { DealAnalyzerPanel } from "@/components/deal-analyzer/DealAnalyzerPanel";
import { MarketTrendsSection } from "@/components/market/MarketTrendsSection";
import { welcomeTaxForPriceCents } from "@/lib/compare/welcome-slug";
import { FsboBuyerDeclarationSummary } from "@/components/fsbo/FsboBuyerDeclarationSummary";
import { computeListingInvestmentRecommendation } from "@/lib/fsbo/listing-investment-recommendation";
import { ListingInvestmentRecommendationCard } from "@/components/fsbo/ListingInvestmentRecommendationCard";
import { DealAnalyzerPhase3BuyerPanel } from "@/components/deal/DealAnalyzerPhase3BuyerPanel";
import {
  isDealAnalyzerAlertsEnabled,
  isDealAnalyzerAutoRefreshEnabled,
  isDealAnalyzerMortgageModeEnabled,
  isDealAnalyzerNegotiationPlaybooksEnabled,
  isDealAnalyzerOfferAssistantEnabled,
  isDealAnalyzerStrategyModesEnabled,
} from "@/modules/deal-analyzer/config";
import { ComparableRefreshStatusCard } from "@/components/deal/ComparableRefreshStatusCard";
import { NegotiationPlaybookCard } from "@/components/deal/NegotiationPlaybookCard";
import { ListingTrustPublicPanel } from "@/components/fsbo/ListingTrustPublicPanel";
import { isCopilotEnabled } from "@/modules/copilot/config";
import { CopilotFloatingDock } from "@/modules/copilot/ui/CopilotFloatingDock";
import { NegotiationDraftsSection } from "@/src/modules/ai-negotiation-deal-intelligence/ui/NegotiationDraftsSection";

export const dynamic = "force-dynamic";

export default async function FsboListingPublicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getGuestId();

  const row = await prisma.fsboListing.findUnique({
    where: { id },
    select: {
      id: true,
      ownerId: true,
      title: true,
      description: true,
      priceCents: true,
      address: true,
      city: true,
      bedrooms: true,
      bathrooms: true,
      surfaceSqft: true,
      images: true,
      coverImage: true,
      status: true,
      moderationStatus: true,
      contactEmail: true,
      contactPhone: true,
      sellerDeclarationJson: true,
      sellerDeclarationCompletedAt: true,
      riskScore: true,
      trustScore: true,
      propertyType: true,
    },
  });

  if (!row) notFound();

  const isOwner = Boolean(userId && row.ownerId === userId);
  let isAdmin = false;
  if (userId) {
    const u = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    isAdmin = u?.role === "ADMIN";
  }
  if (!isFsboPubliclyVisible(row) && !isOwner && !isAdmin) {
    notFound();
  }

  const showContact = isFsboPubliclyVisible(row);

  const welcomeTax = await welcomeTaxForPriceCents(prisma, row.city, row.priceCents, "first_time");

  const investmentRec = computeListingInvestmentRecommendation({
    riskScore: row.riskScore,
    trustScore: row.trustScore,
    priceCents: row.priceCents,
    surfaceSqft: row.surfaceSqft,
    propertyType: row.propertyType,
  });

  const phase3Enabled =
    isDealAnalyzerOfferAssistantEnabled() ||
    isDealAnalyzerMortgageModeEnabled() ||
    isDealAnalyzerAlertsEnabled() ||
    isDealAnalyzerStrategyModesEnabled();

  const phase4BuyerEnabled =
    isDealAnalyzerAutoRefreshEnabled() || isDealAnalyzerNegotiationPlaybooksEnabled();

  return (
    <main className="min-h-screen bg-[#0B0B0B] text-white">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/sell" className="text-sm text-premium-gold hover:text-premium-gold">
          ← All FSBO listings
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <FsboListingGallery
              images={row.images}
              coverImage={row.coverImage}
              title={row.title}
            />
            <h1 className="mt-8 text-3xl font-semibold">{row.title}</h1>
            <p className="mt-2 text-2xl font-bold text-premium-gold">${(row.priceCents / 100).toLocaleString()}</p>
            <div className="mt-4 max-w-xl">
              <ListingInvestmentRecommendationCard recommendation={investmentRec} />
            </div>
            <p className="mt-4 text-[#B3B3B3]">
              {row.address}, {row.city}
            </p>
            <ul className="mt-4 flex flex-wrap gap-4 text-sm text-[#B3B3B3]">
              {row.bedrooms != null ? <li>{row.bedrooms} bed</li> : null}
              {row.bathrooms != null ? <li>{row.bathrooms} bath</li> : null}
              {row.surfaceSqft != null ? <li>{row.surfaceSqft.toLocaleString()} sq ft</li> : null}
            </ul>
            <div className="prose prose-invert mt-8 max-w-none">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{row.description}</p>
            </div>

            {showContact ? (
              <div id="seller-documents" className="scroll-mt-28">
                <FsboBuyerDeclarationSummary
                  sellerDeclarationJson={row.sellerDeclarationJson}
                  sellerDeclarationCompletedAt={row.sellerDeclarationCompletedAt}
                  listingStatus={row.status}
                />
              </div>
            ) : null}

            <div className="mt-10 space-y-10">
              <MarketTrendsSection city={row.city} propertyType="Residential" />
              {phase3Enabled ? (
                <DealAnalyzerPhase3BuyerPanel
                  listingId={row.id}
                  priceCents={row.priceCents}
                  flags={{
                    offer: isDealAnalyzerOfferAssistantEnabled(),
                    mortgage: isDealAnalyzerMortgageModeEnabled(),
                    alerts: isDealAnalyzerAlertsEnabled(),
                    strategyModes: isDealAnalyzerStrategyModesEnabled(),
                  }}
                />
              ) : null}
              {isOwner || isAdmin ? (
                <NegotiationDraftsSection listingId={row.id} />
              ) : null}
              {phase4BuyerEnabled ? (
                <div className="space-y-6 rounded-2xl border border-white/10 bg-[#0B0B0B]/80 p-5">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-premium-gold">
                      Deal Analyzer — Phase 4
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Automation and market-context layers — estimates only, not appraisals or guarantees.
                    </p>
                  </div>
                  {isDealAnalyzerAutoRefreshEnabled() ? (
                    <ComparableRefreshStatusCard listingId={row.id} enabled />
                  ) : null}
                  {isDealAnalyzerNegotiationPlaybooksEnabled() ? (
                    <NegotiationPlaybookCard listingId={row.id} enabled />
                  ) : null}
                </div>
              ) : null}
              <DealAnalyzerPanel
                listingId={row.id}
                priceCents={row.priceCents}
                city={row.city}
                bedrooms={row.bedrooms}
                bathrooms={row.bathrooms}
                surfaceSqft={row.surfaceSqft}
                welcomeTaxDollars={welcomeTax.welcomeTaxCents / 100}
              />
            </div>

            {!showContact && (isOwner || isAdmin) ? (
              <p className="mt-6 rounded-xl border border-amber-500/40 bg-amber-950/30 p-4 text-sm text-amber-200">
                This listing is not public yet (draft, pending moderation, or rejected).{" "}
                {isOwner ? <Link href="/dashboard/fsbo" className="underline">Open dashboard</Link> : null}
              </p>
            ) : null}
          </div>

          <aside className="space-y-6">
            {showContact ? (
              <FsboContactOwnerForm listingId={row.id} />
            ) : (
              <div className="rounded-2xl border border-white/10 bg-[#121212] p-5 text-sm text-[#B3B3B3]">
                Public contact form appears when the listing is live and approved.
              </div>
            )}
            <div className="rounded-2xl border border-white/10 bg-[#121212] p-5 text-sm">
              <p className="text-xs uppercase tracking-wider text-premium-gold">Listed by owner</p>
              <p className="mt-2 text-[#B3B3B3]">Direct sale — no brokerage commission on our side for this module.</p>
              {showContact ? (
                <>
                  <p className="mt-3 text-xs text-slate-500">Owner contact (published)</p>
                  <a href={`mailto:${row.contactEmail}`} className="font-medium text-white hover:text-premium-gold">
                    {row.contactEmail}
                  </a>
                  {row.contactPhone ? (
                    <p className="mt-2">
                      <a href={`tel:${row.contactPhone.replace(/\D/g, "")}`} className="text-premium-gold">
                        {row.contactPhone}
                      </a>
                    </p>
                  ) : null}
                </>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
      {isCopilotEnabled() ? (
        <CopilotFloatingDock listingId={row.id} showSellerQuick={isOwner} />
      ) : null}
    </main>
  );
}
