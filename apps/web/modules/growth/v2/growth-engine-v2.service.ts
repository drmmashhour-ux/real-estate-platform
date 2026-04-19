/**
 * Growth Engine V2 — unified read-only snapshot; aggregates existing analytics safely.
 */

import { getPlatformStats } from "@/modules/analytics/services/get-platform-stats";
import { analyzeBookingFunnel } from "@/modules/growth/booking-funnel-analysis.service";
import { buildGrowthBrokerBridgeSnapshot, estimateBrokerFollowUpDebtProxy } from "./growth-broker-bridge.service";
import { detectGrowthOpportunities } from "./growth-opportunity-detection.service";
import { detectGrowthRisks } from "./growth-risk-detection.service";
import { prioritizeGrowthActions } from "./growth-prioritization.service";
import type { GrowthEngineV2Summary, GrowthHealthBand } from "./growth-engine-v2.types";
import { recordGrowthV2SummaryBuilt } from "./growth-engine-v2-monitoring.service";

function bandFromSparse(sparse: boolean): GrowthHealthBand {
  return sparse ? "insufficient_data" : "ok";
}

function trafficHealthFromPlatform(
  totals: { visitors: number } | undefined,
  sparse: boolean,
): GrowthHealthBand {
  if (sparse || !totals) return "insufficient_data";
  if (totals.visitors >= 5000) return "strong";
  if (totals.visitors >= 800) return "ok";
  return "watch";
}

function conversionHealthFromFunnel(
  checkoutToPaid: number | null,
  sparse: boolean,
): GrowthHealthBand {
  if (sparse) return "insufficient_data";
  if (checkoutToPaid == null) return "watch";
  if (checkoutToPaid >= 35) return "strong";
  if (checkoutToPaid >= 15) return "ok";
  return "watch";
}

function revenueHealthFromPlatform(
  totals: { transactionsClosed: number; listingsTotal: number } | undefined,
  sparse: boolean,
): GrowthHealthBand {
  if (sparse || !totals) return "insufficient_data";
  if (totals.transactionsClosed >= 12) return "strong";
  if (totals.transactionsClosed >= 1) return "ok";
  if (totals.listingsTotal > 20 && totals.transactionsClosed === 0) return "watch";
  return "ok";
}

function bnhubHealthFromFunnel(funnel: Awaited<ReturnType<typeof analyzeBookingFunnel>> | null): GrowthHealthBand {
  if (!funnel) return "insufficient_data";
  if (funnel.counts.bookingStarted === 0) return "insufficient_data";
  const r =
    funnel.counts.bookingStarted > 0 ? funnel.counts.bookingCompleted / funnel.counts.bookingStarted : 0;
  if (r >= 0.45) return "strong";
  if (r >= 0.2) return "ok";
  return "watch";
}

function brokerHealthFromBridge(
  b: Awaited<ReturnType<typeof buildGrowthBrokerBridgeSnapshot>>,
): GrowthHealthBand {
  if (b.sparse || b.avgOverallScore == null) return "insufficient_data";
  if (b.avgOverallScore >= 72 && (b.weakBandShare ?? 1) <= 0.12) return "strong";
  if (b.avgOverallScore >= 58) return "ok";
  return "watch";
}

function platformHealthComposite(
  t: GrowthHealthBand,
  c: GrowthHealthBand,
  r: GrowthHealthBand,
  b: GrowthHealthBand,
  n: GrowthHealthBand,
): GrowthHealthBand {
  const ranks = [t, c, r, b, n].map((x) =>
    x === "strong" ? 3 : x === "ok" ? 2 : x === "watch" ? 1 : 0,
  );
  const avg = ranks.reduce((a, x) => a + x, 0) / ranks.length;
  if (avg >= 2.5) return "strong";
  if (avg >= 1.6) return "ok";
  if (avg >= 0.9) return "watch";
  return "insufficient_data";
}

export async function buildGrowthEngineV2Summary(): Promise<GrowthEngineV2Summary> {
  const dataQualityNotes: string[] = [];

  let platform: Awaited<ReturnType<typeof getPlatformStats>> | null = null;
  try {
    platform = await getPlatformStats(30);
  } catch {
    dataQualityNotes.push("Platform stats query failed — partial snapshot.");
  }

  let funnel: Awaited<ReturnType<typeof analyzeBookingFunnel>> | null = null;
  try {
    funnel = await analyzeBookingFunnel(14);
  } catch {
    dataQualityNotes.push("Booking funnel analysis failed — BNHub signals nominal.");
  }

  const broker = await buildGrowthBrokerBridgeSnapshot({ maxBrokers: 36 });
  dataQualityNotes.push(...broker.notes);

  const debt = await estimateBrokerFollowUpDebtProxy();
  if (debt.note) dataQualityNotes.push(debt.note);

  const sparsePlatform = !platform || platform.totals.visitors < 50;
  const sparseFunnel = !funnel || funnel.counts.pageViews + funnel.counts.landingViews < 20;

  const pack = {
    platform,
    funnel,
    broker,
    followUpDebtRatio: debt.ratio,
    notes: dataQualityNotes,
  };

  const topOpportunities = detectGrowthOpportunities(pack);
  const topRisks = detectGrowthRisks(pack);
  const { today, week } = prioritizeGrowthActions(topOpportunities, topRisks);

  const trafficHealth = trafficHealthFromPlatform(platform?.totals, sparsePlatform);
  const conversionHealth = conversionHealthFromFunnel(funnel?.rates.checkoutToPaidPercent ?? null, sparseFunnel);
  const revenueHealth = revenueHealthFromPlatform(platform?.totals, sparsePlatform);
  const brokerHealth = brokerHealthFromBridge(broker);
  const bnhubHealth = bnhubHealthFromFunnel(funnel);
  const platformHealth = platformHealthComposite(
    trafficHealth,
    conversionHealth,
    revenueHealth,
    brokerHealth,
    bnhubHealth,
  );

  const sparse = sparsePlatform && sparseFunnel && broker.sparse;

  try {
    recordGrowthV2SummaryBuilt({
      sparse,
      oppCount: topOpportunities.length,
      riskCount: topRisks.length,
      actionCount: today.length + week.length,
    });
  } catch {
    /* noop */
  }

  return {
    trafficHealth,
    conversionHealth,
    revenueHealth,
    brokerHealth,
    bnhubHealth,
    platformHealth,
    topOpportunities,
    topRisks,
    topActions: today,
    weeklyActions: week,
    dataQualityNotes,
    generatedAt: new Date().toISOString(),
  };
}
