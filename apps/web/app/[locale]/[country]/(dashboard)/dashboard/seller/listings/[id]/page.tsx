import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getGuestId } from "@/lib/auth/session";
import { fsboListingLifecycleUx } from "@/lib/fsbo/listing-verification";
import { SellerDocumentsPanel } from "@/components/seller/SellerDocumentsPanel";
import { TrustScoreCard } from "@/components/trust/TrustScoreCard";
import { VerificationBadge } from "@/components/trust/VerificationBadge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { TrustBreakdown } from "@/components/trust/TrustBreakdown";
import { SellerDeclarationSummaryCard } from "@/components/trust/SellerDeclarationSummaryCard";
import { ListingTrustGraphPanel } from "@/components/trust/ListingTrustGraphPanel";
import { SellHubLegalChecklistCard } from "@/components/seller/SellHubLegalChecklistCard";
import { CertificateOfLocationHelperPanel } from "@/components/broker-ai/CertificateOfLocationHelperPanel";
import { brokerAiFlags } from "@/config/feature-flags";
import { loadCertificateOfLocationPresentation } from "@/modules/broker-ai/certificate-of-location/certificate-of-location-view-model.service";
import { getCertificateOfLocationBlockerImpact } from "@/modules/broker-ai/certificate-of-location/certificate-of-location-blocker.service";
import { isTrustGraphEnabled } from "@/lib/trustgraph/feature-flags";
import {
  buildTrustBreakdownFromReasons,
  resolveListingVerificationBadge,
} from "@/lib/ui/listing-trust-display";
import { getFsboListingTrustSummary } from "@/lib/fsbo/listing-trust-summary";
import {
  isDealAnalyzerEnabled,
  isDealAnalyzerPricingAdvisorEnabled,
  isDealAnalyzerRepricingTriggersEnabled,
} from "@/modules/deal-analyzer/config";
import { getDealAnalysisPublicDto } from "@/modules/deal-analyzer/application/getDealAnalysis";
import { getSellerPricingAdvisorDto } from "@/modules/deal-analyzer/application/getSellerPricingAdvisor";
import { PropertyDealInsightRail } from "@/components/dashboard/lecipm/PropertyDealInsightRail";
import { ListingImprovementBanner } from "@/components/dashboard/lecipm/ListingImprovementBanner";
import { ShareAnalysisButton } from "@/components/share/ShareAnalysisButton";
import { LecipmVerifiedStrip } from "@/components/trust/LecipmVerifiedStrip";
import { DealAnalysisCard } from "@/components/deal/DealAnalysisCard";
import { SellerPricingAdvisorCard } from "@/components/deal/SellerPricingAdvisorCard";
import { SellerRepricingReviewCard } from "@/components/deal/SellerRepricingReviewCard";
import { DecisionInsightsPanel } from "@/components/decision-engine/DecisionInsightsPanel";
import { DecisionScoreTerminalClient } from "@/components/decision-engine/DecisionScoreTerminalClient";
import { buildDecisionSnapshotForListing } from "@/lib/decision-engine/buildDecisionSnapshot";
import { calculateFraudScore } from "@/modules/fraud-risk/application/calculateFraudScore";
import { declarationSectionCounts, migrateLegacySellerDeclaration, missingDeclarationSections } from "@/lib/fsbo/seller-declaration-schema";
import type { SellerDeclarationAiReview } from "@/lib/fsbo/seller-declaration-ai-review";
import type { MissingItemRow } from "@/components/trust/MissingItemsList";
import { getSellHubLegalChecklist } from "@/lib/fsbo/sell-hub-legal-checklist";
import { syncFsboListingExpiryState } from "@/lib/fsbo/listing-expiry";
import { SellerListingExpiryCard } from "@/components/seller/SellerListingExpiryCard";
import { getListingTransactionFlag } from "@/lib/fsbo/listing-transaction-flag";
import { ListingTransactionFlag } from "@/components/listings/ListingTransactionFlag";
import { PrintPageButton } from "@/components/ui/PrintPageButton";
import { suggestHostPrice } from "@/lib/listings/listing-demand-engine";
import { refreshFsboListingAnalytics } from "@/lib/listings/listing-analytics-service";
import { ListingEsgPitchPanel } from "@/components/green/ListingEsgPitchPanel";
import { PlatformRole } from "@prisma/client";
import { loadFsboListingScore } from "@/modules/listing-ranking/fsbo-score-loader";
import { ListingLecipmScorePanel } from "@/components/dashboard/lecipm/ListingLecipmScorePanel";

export const dynamic = "force-dynamic";

function parseAiReview(raw: unknown): SellerDeclarationAiReview | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (o.version !== 1) return null;
  return raw as SellerDeclarationAiReview;
}

export default async function SellerHubListingDetailPage({
  params,
}: {
  params: Promise<{ locale: string; country: string; id: string }>;
}) {
  const userId = await getGuestId();
  if (!userId) redirect("/auth/login");

  const { id } = await params;
  await syncFsboListingExpiryState(id, { sendReminder: true }).catch(() => null);
  const listing = await prisma.fsboListing.findFirst({
    where: { id, ownerId: userId },
    include: { verification: true },
  });
  if (!listing) notFound();

  const owner = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, role: true },
  });

  const ux = fsboListingLifecycleUx(listing.status, listing.moderationStatus, listing.verification);
  const canEditDocs = listing.status !== "SOLD" && listing.status !== "PENDING_VERIFICATION";
  const identityVerified = listing.verification?.identityStatus === "VERIFIED";

  const reasons = Array.isArray(listing.aiScoreReasonsJson)
    ? listing.aiScoreReasonsJson.filter((x): x is string => typeof x === "string")
    : [];
  const trustSummary = await getFsboListingTrustSummary(listing.id);
  const baseBreakdown = buildTrustBreakdownFromReasons(reasons, listing.trustScore);
  const missing =
    trustSummary && trustSummary.missingItems.length > 0
      ? trustSummary.missingItems.map((m, i) => ({
          id: `tg-${i}`,
          label: m.message,
          severity: "danger" as const,
        }))
      : baseBreakdown.missing;
  const warnings = baseBreakdown.warnings;
  const passed = baseBreakdown.passed;

  const badgeVariant = resolveListingVerificationBadge({
    ux,
    identityVerified,
    trustScore: listing.trustScore,
  });

  const readinessPct = listing.trustScore ?? 0;

  const declData = migrateLegacySellerDeclaration(listing.sellerDeclarationJson);
  const { completed, total } = declarationSectionCounts(declData, listing.propertyType);
  const completionPct =
    listing.sellerDeclarationCompletedAt != null
      ? 100
      : total > 0
        ? Math.round((100 * completed) / total)
        : 0;

  const missingSectionIds = missingDeclarationSections(declData, listing.propertyType);
  const missingFields: MissingItemRow[] = missingSectionIds.map((sid, i) => ({
    id: `sec-${i}`,
    label: `Complete section: ${String(sid).replace(/_/g, " ")}`,
    severity: "danger",
  }));

  const review = parseAiReview(listing.sellerDeclarationAiReviewJson);
  const contradictions: MissingItemRow[] = [];
  review?.detectedRisks?.forEach((r, i) => {
    contradictions.push({
      id: `risk-${i}`,
      label: r.message,
      severity: r.severity === "HIGH" ? "danger" : "warning",
    });
  });
  review?.missingInformation?.forEach((m, i) => {
    contradictions.push({ id: `miss-${i}`, label: m, severity: "warning" });
  });

  const readinessLabel =
    listing.sellerDeclarationCompletedAt != null
      ? "Ready to submit for review"
      : completionPct >= 80
        ? "Almost there — finish remaining sections"
        : completionPct >= 40
          ? "In progress — complete declaration"
          : "Start or continue your declaration";

  const trustgraphOn = isTrustGraphEnabled();

  const dealAnalysisDto = isDealAnalyzerEnabled() ? await getDealAnalysisPublicDto(listing.id) : null;
  const decisionSnapshot = isDealAnalyzerEnabled() ? await buildDecisionSnapshotForListing(listing.id) : null;
  const fraudSnapshot = isDealAnalyzerEnabled() ? await calculateFraudScore(prisma, listing.id) : null;
  const pricingAdvisorDto =
    isDealAnalyzerPricingAdvisorEnabled() ? await getSellerPricingAdvisorDto(listing.id) : null;
  const legalChecklist = await getSellHubLegalChecklist(listing.id);
  const certificateCol =
    brokerAiFlags.brokerAiCertificateOfLocationV1
      ? await loadCertificateOfLocationPresentation({ listingId: listing.id })
      : null;
  const transactionFlag = await getListingTransactionFlag(listing.id, listing.status);

  const demandAnalytics = await refreshFsboListingAnalytics(listing.id, listing.priceCents);
  const hostPriceHint = suggestHostPrice({
    currentPriceCents: listing.priceCents,
    demandScore: demandAnalytics.demandScore,
  });

  const scoreHistory = await prisma.listingAiScore.findMany({
    where: { fsboListingId: listing.id },
    orderBy: { createdAt: "asc" },
    take: 24,
  });
  let improvementPct: number | null = null;
  if (scoreHistory.length >= 2) {
    const oldest = scoreHistory[0]!;
    const newest = scoreHistory[scoreHistory.length - 1]!;
    if (oldest.trustScore > 0) {
      improvementPct = Math.round(((newest.trustScore - oldest.trustScore) / oldest.trustScore) * 100);
    }
  }

  return (
    <main className="min-h-screen bg-[#0D0D0D] px-4 py-10 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <Link href="/dashboard/seller/listings" className="text-sm text-premium-gold transition hover:underline">
          ← All listings
        </Link>

        <div className="mt-6 grid gap-8 lg:grid-cols-3 lg:items-start">
          <div className="space-y-6 lg:col-span-2">
            <div>
              <h1 className="text-2xl font-semibold text-white sm:text-3xl">{listing.title}</h1>
              {listing.listingCode ? (
                <p className="mt-2 font-mono text-xs text-slate-500">Listing code · {listing.listingCode}</p>
              ) : null}
              <p className="mt-1 text-sm text-slate-500">
                {listing.city} · {(listing.priceCents / 100).toLocaleString(undefined, { style: "currency", currency: "CAD" })}
              </p>
              {transactionFlag ? (
                <div className="mt-3">
                  <ListingTransactionFlag flag={transactionFlag} />
                </div>
              ) : null}
              <p className="mt-4 text-sm text-slate-400">
                Status: <span className="text-slate-200">{ux}</span>
              </p>
              {listing.rejectReason ? (
                <p className="mt-2 text-sm text-red-300">Rejection reason: {listing.rejectReason}</p>
              ) : null}
              <div className="mt-4">
                <ListingImprovementBanner improvementPct={improvementPct} />
              </div>
            </div>

            {lecipmListingScorePack ? (
              <ListingLecipmScorePanel {...lecipmListingScorePack.result} />
            ) : null}

            <ListingEsgPitchPanel listingPayload={esgPitchPayload} brokerPremium={brokerPremium} />

            <div className="rounded-2xl border border-white/10 bg-[#121212] p-5">
              <h2 className="text-sm font-semibold text-white">Buyer demand signal</h2>
              <p className="mt-1 text-xs text-slate-500">
                Based on real views, saves, and contact interest (refreshed periodically — not live to the second).
              </p>
              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Demand score</dt>
                  <dd className="font-semibold text-premium-gold">{demandAnalytics.demandScore}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Views (24h)</dt>
                  <dd className="text-slate-200">{demandAnalytics.views24hCached}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Saves</dt>
                  <dd className="text-slate-200">{demandAnalytics.saves}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-500">Contact taps</dt>
                  <dd className="text-slate-200">{demandAnalytics.contactClicks}</dd>
                </div>
              </dl>
              {hostPriceHint ? (
                <div className="mt-4 rounded-xl border border-premium-gold/25 bg-premium-gold/5 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-premium-gold">Price suggestion</p>
                  <p className="mt-2 text-sm text-slate-200">{hostPriceHint.reason}</p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {(hostPriceHint.suggestedPriceCents / 100).toLocaleString(undefined, {
                      style: "currency",
                      currency: "CAD",
                    })}{" "}
                    <span className="text-sm font-normal text-slate-400">
                      ({hostPriceHint.pctChange > 0 ? "+" : ""}
                      {hostPriceHint.pctChange.toFixed(0)}% vs list)
                    </span>
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Confidence: {Math.round(hostPriceHint.confidence * 100)}% (heuristic from demand signals, not a
                    guarantee)
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{hostPriceHint.explanation}</p>
                </div>
              ) : (
                <p className="mt-4 text-xs text-slate-500">
                  No automated price adjustment suggested — demand is in a balanced range for now.
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/dashboard/seller/create?id=${encodeURIComponent(listing.id)}`}
                className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-slate-200 transition duration-200 hover:scale-[1.02] hover:border-premium-gold/40 hover:bg-white/5"
              >
                Edit in wizard
              </Link>
              <Link
                href={`/sell/${listing.id}`}
                className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-slate-200 transition duration-200 hover:scale-[1.02] hover:border-premium-gold/40 hover:bg-white/5"
              >
                Public view
              </Link>
              <Link
                href={`/api/fsbo/listings/${listing.id}/export`}
                target="_blank"
                className="rounded-full border border-white/15 px-5 py-2.5 text-sm text-slate-200 transition duration-200 hover:scale-[1.02] hover:border-premium-gold/40 hover:bg-white/5"
              >
                Open legal packet
              </Link>
              <PrintPageButton label="Print seller packet" />
            </div>

            <SellerDeclarationSummaryCard
              completionPct={completionPct}
              missingFields={missingFields}
              contradictions={contradictions}
              readinessLabel={readinessLabel}
              editHref={`/dashboard/seller/create?id=${encodeURIComponent(listing.id)}`}
            />

            <SellerListingExpiryCard
              listingId={listing.id}
              expiresAt={listing.expiresAt?.toISOString() ?? null}
              archived={Boolean(listing.archivedAt) || listing.status === "ARCHIVED"}
              expired={Boolean(listing.expiresAt && listing.expiresAt.getTime() <= Date.now())}
              renewable={listing.listingOwnerType === "SELLER" && listing.status !== "SOLD"}
              ownerType={listing.listingOwnerType}
            />

            {legalChecklist ? <SellHubLegalChecklistCard checklist={legalChecklist} /> : null}

            {certificateCol ? (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-premium-gold/80">
                  Broker AI helper — certificate of location
                </p>
                <CertificateOfLocationHelperPanel
                  listingId={listing.id}
                  viewModel={certificateCol.viewModel}
                  blockerImpact={getCertificateOfLocationBlockerImpact(certificateCol.summary)}
                />
              </div>
            ) : null}

            {isDealAnalyzerEnabled() ? (
              <DealAnalysisCard listingId={listing.id} analysis={dealAnalysisDto} showRunButton />
            ) : null}

            {isDealAnalyzerEnabled() && !decisionSnapshot ? (
              <DecisionInsightsPanel listingId={listing.id} initial={decisionSnapshot} />
            ) : null}

            {isDealAnalyzerPricingAdvisorEnabled() ? (
              <SellerPricingAdvisorCard listingId={listing.id} enabled initial={pricingAdvisorDto} />
            ) : null}

            {isDealAnalyzerRepricingTriggersEnabled() ? (
              <SellerRepricingReviewCard listingId={listing.id} enabled />
            ) : null}

            <div className="rounded-2xl border border-white/10 bg-[#121212] p-6">
              <h2 className="text-lg font-semibold text-white">Documents</h2>
              <p className="mt-1 text-sm text-[#A1A1A1]">Upload and manage proof for this listing.</p>
              <div className="mt-6">
                <SellerDocumentsPanel fsboListingId={listing.id} canEdit={canEditDocs} />
              </div>
            </div>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-8">
            {isDealAnalyzerEnabled() && decisionSnapshot ? (
              <div className="rounded-2xl border border-zinc-700/60 bg-[#080808] p-4 shadow-[0_20px_56px_rgba(0,0,0,0.65)]">
                <DecisionScoreTerminalClient
                  listingId={listing.id}
                  initial={decisionSnapshot}
                  dealReasons={dealAnalysisDto?.reasons ?? []}
                  fraud={fraudSnapshot}
                />
              </div>
            ) : (
              <>
                <PropertyDealInsightRail
                  listingId={listing.id}
                  trustScore={listing.trustScore}
                  analysis={dealAnalysisDto}
                  missingItemsCount={missing.length + missingFields.length + contradictions.length}
                />
                <TrustScoreCard
                  score={listing.trustScore ?? trustSummary?.overallScore ?? null}
                  label="Trust score"
                  sublabel={
                    trustSummary?.readinessLevel
                      ? `Readiness: ${trustSummary.readinessLevel}. Informational — improves as you complete verification.`
                      : "Informational — improves as you complete verification."
                  }
                />
              </>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <VerificationBadge variant={badgeVariant} />
            </div>
            <LecipmVerifiedStrip variant={badgeVariant} />
            <div className="rounded-2xl border border-white/10 bg-[#121212] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#A1A1A1]">Readiness</p>
              <ProgressBar value={readinessPct} label="Listing readiness" accent="gold" className="mt-3" />
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#121212] p-5">
              <TrustBreakdown missing={missing} warnings={warnings} passed={passed} />
            </div>
            {trustgraphOn ? (
              <div className="rounded-2xl border border-premium-gold/20 bg-[#121212] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-premium-gold">TrustGraph</p>
                <ListingTrustGraphPanel listingId={listing.id} enabled />
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}
