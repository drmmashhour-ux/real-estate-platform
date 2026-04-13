/**
 * Demo: persist a deal analysis for an FSBO listing.
 * Usage: DEAL_ANALYZER_ENABLED=true LISTING_ID=<fsbo id> npx tsx prisma/seed-deal-analyzer-demo.ts
 * Optional Phase 2: DEAL_ANALYZER_COMPS_ENABLED=true DEAL_ANALYZER_SCENARIOS_ENABLED=true
 *   npx tsx prisma/seed-deal-analyzer-demo.ts
 * Optional BNHUB overlay: SHORT_TERM_LISTING_ID=<bnhub uuid> DEAL_ANALYZER_BNHUB_MODE_ENABLED=true
 *
 * Manual QA matrix (pick listings in your DB that match each profile):
 * - Strong rental cash-flow: high investment score, rental scenarios non-low confidence.
 * - Overpriced vs comps: list price above_comparable_range when enough comps exist.
 * - High trust, weak comps: high trustScore but comparablesSummary insufficient_comparable_data.
 * - BNHUB strong short-term: SHORT_TERM_LISTING_ID with verified listing + positive net in bnhub overlay.
 * - BNHUB insufficient data: SHORT_TERM_LISTING_ID with nightPriceCents=0 or invalid.
 * - Mixed portfolio: GET portfolio-status with multiple compareIds after Phase 2 on each.
 * - Value-add: Phase 1 value_add_candidate + Phase 2 review.
 * - High risk / TrustGraph: low trust or high riskScore with Phase 2 caution / insufficient_data.
 *
 * Phase 4 (optional; set flags + LISTING_ID; see also prisma/seed-deal-analyzer-phase4-demo.ts):
 * - Stale comparable refresh: DEAL_ANALYZER_AUTO_REFRESH_ENABLED=true (runs manual comparable refresh job).
 * - Dense vs sparse regional profiles: toggle DEAL_ANALYZER_REGION_RULES_ENABLED and listing city / peer counts.
 * - Negotiation playbook: DEAL_ANALYZER_NEGOTIATION_PLAYBOOKS_ENABLED=true.
 * - Repricing review: DEAL_ANALYZER_REPRICING_TRIGGERS_ENABLED=true.
 * - Portfolio monitoring: DEAL_ANALYZER_PORTFOLIO_MONITORING_ENABLED=true + DEAL_ANALYZER_DEMO_USER_ID
 *   (watchlist is created when alerts or portfolio monitoring is enabled).
 */
import { prisma } from "../lib/db";
import { runDealAnalysis } from "../modules/deal-analyzer/application/runDealAnalysis";
import { runDealAnalyzerPhase2 } from "../modules/deal-analyzer/application/runDealAnalyzerPhase2";
import { runOfferStrategy } from "../modules/deal-analyzer/application/runOfferStrategy";
import { runMortgageAffordabilityAnalysis } from "../modules/deal-analyzer/application/runMortgageAffordabilityAnalysis";
import { runSellerPricingAdvisor } from "../modules/deal-analyzer/application/runSellerPricingAdvisor";
import { createWatchlist } from "../modules/deal-analyzer/application/createWatchlist";
import { addPropertyToWatchlist } from "../modules/deal-analyzer/infrastructure/services/watchlistService";
import { evaluateWatchlistAlerts } from "../modules/deal-analyzer/infrastructure/services/alertTriggerService";
import { scheduleComparableRefresh } from "../modules/deal-analyzer/application/scheduleComparableRefresh";
import { RefreshTriggerSource } from "../modules/deal-analyzer/domain/refresh";
import { generateNegotiationPlaybook } from "../modules/deal-analyzer/application/generateNegotiationPlaybook";
import { runSellerRepricingReview } from "../modules/deal-analyzer/application/runSellerRepricingReview";
import { monitorInvestorPortfolio } from "../modules/deal-analyzer/application/monitorInvestorPortfolio";

async function main() {
  const id = process.env.LISTING_ID;
  if (!id?.trim()) {
    console.error("Set LISTING_ID to an fsbo_listings.id");
    process.exit(1);
  }
  const out = await runDealAnalysis({ listingId: id.trim(), analysisType: "listing" });
  if (!out.ok) {
    console.error(out.error);
    process.exit(1);
  }
  console.log("Created analysis", out.analysisId);

  const st = process.env.SHORT_TERM_LISTING_ID?.trim();
  const p2 = await runDealAnalyzerPhase2({
    listingId: id.trim(),
    shortTermListingId: st || null,
  });
  if (!p2.ok) {
    console.warn("Phase 2 skipped or failed:", p2.error);
  } else {
    console.log("Phase 2 steps", p2.steps);
  }

  const demoUser = process.env.DEAL_ANALYZER_DEMO_USER_ID?.trim();
  if (process.env.DEAL_ANALYZER_OFFER_ASSISTANT_ENABLED === "true") {
    const o = await runOfferStrategy({ listingId: id.trim(), strategyMode: "buy_to_rent" });
    console.log("Phase 3 offer strategy", o.ok ? "ok" : o.error);
  }
  if (process.env.DEAL_ANALYZER_MORTGAGE_MODE_ENABLED === "true") {
    const a = await runMortgageAffordabilityAnalysis({
      listingId: id.trim(),
      downPaymentCents: null,
      annualRate: null,
      termYears: null,
      monthlyIncomeCents: null,
      monthlyDebtsCents: null,
    });
    console.log("Phase 3 affordability", a.ok ? "ok" : a.error);
  }
  if (process.env.DEAL_ANALYZER_PRICING_ADVISOR_ENABLED === "true") {
    const p = await runSellerPricingAdvisor({ listingId: id.trim() });
    console.log("Phase 3 pricing advisor", p.ok ? "ok" : p.error);
  }
  let demoWatchlistId: string | null = null;
  if (
    demoUser &&
    (process.env.DEAL_ANALYZER_ALERTS_ENABLED === "true" ||
      process.env.DEAL_ANALYZER_PORTFOLIO_MONITORING_ENABLED === "true")
  ) {
    const wl = await createWatchlist({ userId: demoUser, name: "Demo watchlist" });
    if (wl.ok) {
      demoWatchlistId = wl.watchlist.id;
      const added = await addPropertyToWatchlist({
        watchlistId: wl.watchlist.id,
        userId: demoUser,
        propertyId: id.trim(),
      });
      const latest = await prisma.dealAnalysis.findFirst({
        where: { propertyId: id.trim() },
        orderBy: { createdAt: "desc" },
      });
      if (added && latest) {
        await prisma.dealWatchlistItem.update({
          where: { id: added.id },
          data: {
            lastInvestmentScore: latest.investmentScore - 6,
            lastRiskScore: latest.riskScore,
            lastOpportunityType: latest.opportunityType,
          },
        });
      }
      if (process.env.DEAL_ANALYZER_ALERTS_ENABLED === "true") {
        const ev = await evaluateWatchlistAlerts(wl.watchlist.id);
        console.log("Phase 3 watchlist evaluate — alerts created:", ev.created);
      }
    } else {
      console.warn("watchlist:", wl.error);
    }
  }

  if (process.env.DEAL_ANALYZER_AUTO_REFRESH_ENABLED === "true") {
    const r = await scheduleComparableRefresh({
      listingId: id.trim(),
      triggerSource: RefreshTriggerSource.MANUAL,
      runSync: true,
    });
    console.log("Phase 4 comparable refresh", r);
  }
  if (process.env.DEAL_ANALYZER_NEGOTIATION_PLAYBOOKS_ENABLED === "true") {
    const pb = await generateNegotiationPlaybook(id.trim());
    console.log("Phase 4 negotiation playbook", pb.ok ? pb.marketCondition : pb.error);
  }
  if (process.env.DEAL_ANALYZER_REPRICING_TRIGGERS_ENABLED === "true") {
    const rr = await runSellerRepricingReview(id.trim());
    console.log("Phase 4 repricing review", rr.ok ? `triggers +${rr.triggersCreated}` : rr.error);
  }
  if (process.env.DEAL_ANALYZER_PORTFOLIO_MONITORING_ENABLED === "true" && demoUser && demoWatchlistId) {
    const pm = await monitorInvestorPortfolio({
      watchlistId: demoWatchlistId,
      userId: demoUser,
    });
    console.log("Phase 4 portfolio monitoring", pm.ok ? "ok" : pm.error);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
