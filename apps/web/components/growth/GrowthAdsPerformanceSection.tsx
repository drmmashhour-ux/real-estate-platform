import Link from "next/link";
import {
  computeAdsPerformanceAlerts,
  detectWinningCampaigns,
  getAdsPerformanceByCampaign,
  getAdsPerformanceSummary,
  getFullGrowthAnalysis,
} from "@/modules/ads/ads-performance.service";
import { getManualSpendAggregatedForAdsWindow } from "@/modules/ads/growth-ops-manual-spend.service";
import { generateScalingRecommendations } from "@/modules/ads/ads-scaling-recommendations.service";
import {
  buildCampaignProfitMetrics,
  buildPortfolioInputsFromCampaignMetrics,
  computeProfitEngineAlerts,
  generateProfitRecommendations,
  maybeIngestProfitEngineIntoUnifiedLearning,
} from "@/modules/growth/profit-engine.service";
import type { CampaignProfitMetrics, ProfitRecommendation } from "@/modules/growth/profit-engine.types";
import { portfolioOptimizationFlags, profitEngineFlags } from "@/config/feature-flags";
import { buildPortfolioOptimizationSummary } from "@/modules/growth/portfolio-optimization.service";
import { persistPortfolioOptimizationSnapshot } from "@/modules/growth/portfolio-optimization.repository";
import type { PortfolioOptimizationSummary } from "@/modules/growth/portfolio-optimization.types";
import { computePortfolioAlerts, type PortfolioAlert } from "@/modules/growth/portfolio-alerts.service";
import { maybeIngestPortfolioOptimizationSignals } from "@/modules/growth/unified-learning.service";
import { logGrowthAutonomousOptimizerRun } from "@/modules/growth/tracking.service";
import { getRetargetingAudiences } from "@/modules/ads/retargeting.service";
import { GrowthAutonomousOptimizerSection } from "@/components/growth/GrowthAutonomousOptimizerSection";
import { runAutoOptimizer } from "@/services/growth/auto-optimizer.job";

const RANGE_DAYS = 14;

function evidenceBadgeClass(q: CampaignProfitMetrics["evidenceQuality"] | undefined) {
  switch (q) {
    case "HIGH":
      return "border-emerald-600/60 bg-emerald-950/50 text-emerald-100";
    case "MEDIUM":
      return "border-amber-700/50 bg-amber-950/35 text-amber-100";
    case "LOW":
      return "border-zinc-700/60 bg-zinc-900/50 text-zinc-400";
    default:
      return "border-zinc-700/60 bg-zinc-900/40 text-zinc-500";
  }
}

function profitTrendLabel(t: CampaignProfitMetrics["profitTrend"] | undefined): string {
  if (!t || t === "insufficient_data") return "—";
  return t.replace(/_/g, " ");
}

function profitStatusBadgeClass(s: CampaignProfitMetrics["profitabilityStatus"]) {
  switch (s) {
    case "PROFITABLE":
      return "border-emerald-700/50 bg-emerald-950/40 text-emerald-100";
    case "BREAKEVEN":
      return "border-amber-800/50 bg-amber-950/30 text-amber-100";
    case "UNPROFITABLE":
      return "border-rose-800/50 bg-rose-950/35 text-rose-100";
    default:
      return "border-zinc-700/60 bg-zinc-900/40 text-zinc-300";
  }
}

function profitRecActionClass(a: ProfitRecommendation["action"]) {
  switch (a) {
    case "SCALE":
      return "text-emerald-300";
    case "PAUSE":
      return "text-rose-300";
    case "FIX_FUNNEL":
      return "text-amber-200";
    default:
      return "text-zinc-400";
  }
}

export async function GrowthAdsPerformanceSection({
  locale = "en",
  country = "ca",
}: {
  locale?: string;
  country?: string;
} = {}) {
  const [spendCurrent, spendPrevious] = await Promise.all([
    getManualSpendAggregatedForAdsWindow(RANGE_DAYS, 0),
    getManualSpendAggregatedForAdsWindow(RANGE_DAYS, RANGE_DAYS),
  ]);

  const [summary, campaigns, alerts, retarget] = await Promise.all([
    getAdsPerformanceSummary(RANGE_DAYS, { estimatedSpend: spendCurrent.totalDollars }),
    getAdsPerformanceByCampaign(RANGE_DAYS, { estimatedSpendByCampaign: spendCurrent.byCampaign }),
    computeAdsPerformanceAlerts(RANGE_DAYS, {
      estimatedSpendCurrent: spendCurrent.totalDollars,
      estimatedSpendPrevious: spendPrevious.totalDollars,
    }),
    getRetargetingAudiences(RANGE_DAYS),
  ]);

  const spendOpsHref = `/${locale}/${country}/admin/growth-ops-spend`;
  const cplNeedsSpend = summary.estimatedSpend <= 0;
  const cplBlockedNoLeads = summary.estimatedSpend > 0 && summary.leads <= 0;

  const { winners, losers } = detectWinningCampaigns(campaigns);

  const profitMetrics = await buildCampaignProfitMetrics(campaigns);
  const profitByCampaign: Record<string, CampaignProfitMetrics> = Object.fromEntries(
    profitMetrics.map((m) => [m.campaignId, m]),
  );
  const profitTrendByCampaign = profitEngineFlags.profitEngineTrendsV1
    ? Object.fromEntries(profitMetrics.map((m) => [m.campaignId, m.profitTrend ?? "insufficient_data"]))
    : undefined;
  const conversionRates = Object.fromEntries(
    campaigns.map((c) => [c.campaignKey, (c.conversionRatePercent ?? 0) / 100]),
  );
  const profitRecommendations = generateProfitRecommendations(profitMetrics, conversionRates);
  const profitAlerts = computeProfitEngineAlerts(campaigns, profitMetrics);
  maybeIngestProfitEngineIntoUnifiedLearning(profitMetrics);

  let portfolioInputs: ReturnType<typeof buildPortfolioInputsFromCampaignMetrics> = [];
  let portfolioSummary: PortfolioOptimizationSummary | null = null;
  let portfolioAlertsList: PortfolioAlert[] = [];

  if (portfolioOptimizationFlags.portfolioOptimizationV1) {
    portfolioInputs = buildPortfolioInputsFromCampaignMetrics(campaigns, profitMetrics);
    portfolioSummary = buildPortfolioOptimizationSummary(portfolioInputs);
    maybeIngestPortfolioOptimizationSignals(portfolioSummary, portfolioInputs);
    if (portfolioOptimizationFlags.portfolioOptimizationPersistenceV1) {
      void persistPortfolioOptimizationSnapshot(portfolioSummary).catch(() => {});
    }
    if (portfolioOptimizationFlags.portfolioOptimizationAlertsV1) {
      portfolioAlertsList = computePortfolioAlerts(portfolioSummary, portfolioInputs);
    }
  }

  const recommendations = generateScalingRecommendations(winners, losers, {
    stableWinnerKeys: winners.filter((w) => (w.ctrPercent ?? 0) >= 2).map((w) => w.campaignKey),
    profitByCampaign,
    profitTrendByCampaign,
  });

  const mergedAlerts = [...alerts, ...profitAlerts];

  const funnelEvents = {
    landing_view: summary.impressions,
    cta_click: summary.clicks,
    lead_capture: summary.leads,
    booking_started: summary.bookingsStarted,
    booking_completed: summary.bookingsCompleted,
  };
  const fullAnalysis = getFullGrowthAnalysis(funnelEvents);
  const optimizerRun = runAutoOptimizer({
    events: funnelEvents,
    campaigns: campaigns.map((m) => ({ id: m.campaignKey, metrics: m })),
    analysis: fullAnalysis,
  });
  logGrowthAutonomousOptimizerRun({
    healthScore: fullAnalysis.healthScore,
    leakCount: fullAnalysis.leaks.length,
    campaignCount: optimizerRun.campaignDecisions.length,
    decisions: optimizerRun.campaignDecisions.map((d) => ({ id: d.id, action: d.decision.action })),
  });

  return (
    <section
      className="rounded-2xl border border-sky-900/40 bg-sky-950/20 p-5 sm:p-6"
      data-growth-ads-performance-section
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-400/90">Ads Performance</p>
          <h2 className="mt-1 text-lg font-bold tracking-tight">Scaling engine (growth_events)</h2>
        </div>
        <div className="text-right">
          <p className="text-xs text-zinc-500">
            Last {RANGE_DAYS} days · attributed spend ${summary.estimatedSpend.toFixed(2)} CAD · no auto-spend · LTV is
            heuristic until wired to booking revenue
          </p>
          <Link
            href={spendOpsHref}
            className="mt-1 inline-block text-xs font-medium text-sky-400 hover:text-sky-300 hover:underline"
          >
            Manual spend input →
          </Link>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-800/80 bg-black/25 px-3 py-2" data-growth-kpi="ctr">
          <p className="text-xs text-zinc-500">CTR (clicks ÷ landing views)</p>
          <p className="text-xl font-semibold text-white">{summary.ctrPercent != null ? `${summary.ctrPercent}%` : "—"}</p>
        </div>
        <div className="rounded-lg border border-zinc-800/80 bg-black/25 px-3 py-2" data-growth-kpi="cpl">
          <p className="text-xs text-zinc-500">CPL (spend ÷ leads)</p>
          <p className="text-xl font-semibold text-white">
            {summary.cpl != null ? `$${summary.cpl.toFixed(2)}` : "—"}
          </p>
          {cplNeedsSpend ? (
            <p className="mt-1 text-[11px] font-medium text-amber-200/90">CPL requires spend input</p>
          ) : cplBlockedNoLeads ? (
            <p className="mt-1 text-[11px] text-zinc-500">No leads in window — CPL N/A</p>
          ) : null}
        </div>
        <div className="rounded-lg border border-zinc-800/80 bg-black/25 px-3 py-2" data-growth-kpi="conversion">
          <p className="text-xs text-zinc-500">Conversion (bookings ÷ clicks)</p>
          <p className="text-xl font-semibold text-white">
            {summary.conversionRatePercent != null ? `${summary.conversionRatePercent}%` : "—"}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-xs text-zinc-400 sm:grid-cols-5">
        <span>
          Impressions (landing_view): <strong className="text-zinc-200">{summary.impressions}</strong>
        </span>
        <span>
          Clicks (cta_click): <strong className="text-zinc-200">{summary.clicks}</strong>
        </span>
        <span>
          Leads (lead_capture): <strong className="text-zinc-200">{summary.leads}</strong>
        </span>
        <span>
          Bookings started: <strong className="text-zinc-200">{summary.bookingsStarted}</strong>
        </span>
        <span>
          Bookings completed: <strong className="text-zinc-200">{summary.bookingsCompleted}</strong>
        </span>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-zinc-800/80 bg-black/20">
        <p className="border-b border-zinc-800/80 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-sky-400/90">
          Campaign economics (estimate) · Profit engine v2
        </p>
        <table className="w-full min-w-[720px] text-left text-xs text-zinc-300">
          <thead className="border-b border-zinc-800/80 bg-zinc-950/50 text-[10px] uppercase text-zinc-500">
            <tr>
              <th className="px-3 py-2">Campaign</th>
              <th className="px-3 py-2">Leads</th>
              <th className="px-3 py-2">CPL</th>
              <th className="px-3 py-2">LTV (est.)</th>
              <th className="px-3 py-2">LTV/CPL</th>
              <th className="px-3 py-2">Profit / lead</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-4 text-zinc-500">
                  No UTM campaigns in this window.
                </td>
              </tr>
            ) : (
              profitMetrics.map((m) => {
                const ratioLabel =
                  m.ltvToCplRatio != null ? `${m.ltvToCplRatio.toFixed(2)}×` : "—";
                const profitLine =
                  m.profitPerLead != null && m.ltvToCplRatio != null
                    ? `Profit: ${m.profitPerLead >= 0 ? "+" : ""}$${m.profitPerLead.toFixed(0)} · LTV/CPL ${ratioLabel}`
                    : m.profitabilityStatus === "INSUFFICIENT_DATA"
                      ? "Need ≥3 leads + CPL + LTV from bookings"
                      : "—";
                const confPct =
                  m.confidenceScore != null ? `${Math.round(m.confidenceScore * 100)}%` : "—";
                const mutedRow =
                  profitEngineFlags.profitEngineConfidenceV1 && m.evidenceQuality === "LOW";
                const tooltip = `Based on ${m.sampleLeads ?? 0} leads / ${m.sampleBookings ?? 0} bookings (window). LTV is estimate-only when booking signal exists.`;
                return (
                  <tr
                    key={m.campaignId}
                    className={`border-b border-zinc-900/80 last:border-0 ${mutedRow ? "opacity-75" : ""}`}
                    title={tooltip}
                  >
                    <td className="px-3 py-2 font-mono text-[11px] text-sky-200/90">{m.campaignId}</td>
                    <td className="px-3 py-2">{m.sampleLeads ?? "—"}</td>
                    <td className="px-3 py-2">{m.cpl != null ? `$${m.cpl.toFixed(2)}` : "—"}</td>
                    <td className="px-3 py-2">
                      {m.avgLTV != null ? `$${m.avgLTV.toFixed(0)}` : "—"}{" "}
                      <span className="text-[10px] text-zinc-600">est.</span>
                    </td>
                    <td className="px-3 py-2">{ratioLabel}</td>
                    <td className="px-3 py-2 text-zinc-200">{profitLine}</td>
                    <td className="px-3 py-2 tabular-nums text-zinc-300">{confPct}</td>
                    <td className="px-3 py-2">
                      {m.evidenceQuality ? (
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${evidenceBadgeClass(
                            m.evidenceQuality,
                          )}`}
                        >
                          {m.evidenceQuality}
                        </span>
                      ) : (
                        <span className="text-zinc-600">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-[10px] capitalize text-zinc-400">{profitTrendLabel(m.profitTrend)}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium ${profitStatusBadgeClass(
                          m.profitabilityStatus,
                        )}`}
                      >
                        {m.profitabilityStatus.replace(/_/g, " ")}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {portfolioOptimizationFlags.portfolioOptimizationV1 && portfolioSummary ? (
        <div
          className="mt-6 rounded-xl border border-indigo-900/40 bg-indigo-950/15 p-4"
          data-growth-portfolio-optimization
        >
          <h3 className="text-sm font-semibold text-indigo-200/90">Portfolio optimization (manual only)</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Suggested budget shifts across UTM campaigns from profitability, confidence, trend, and volume — not executed by
            LECIPM. LTV remains an estimate until tied to realized revenue.
          </p>
          <div className="mt-3 grid gap-2 text-xs text-zinc-400 sm:grid-cols-2">
            <p>
              Total attributed budget (window):{" "}
              <span className="font-medium text-zinc-200">${portfolioSummary.totalBudget.toFixed(2)}</span>
            </p>
            <p>
              Suggested reallocatable (sum of suggestion amounts):{" "}
              <span className="font-medium text-zinc-200">${portfolioSummary.reallocatableBudget.toFixed(2)}</span>
            </p>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Top portfolio scores</p>
              <ul className="mt-2 space-y-1 text-xs text-zinc-300">
                {portfolioSummary.topCampaigns.length === 0 ? (
                  <li className="text-zinc-500">None in TOP/GOOD band for this window.</li>
                ) : (
                  portfolioSummary.topCampaigns.slice(0, 8).map((t) => (
                    <li key={t.campaignKey} className="rounded border border-zinc-800/60 bg-black/20 px-2 py-1">
                      <span className="font-mono text-indigo-200/90">{t.campaignKey}</span> · score {t.portfolioScore} ·{" "}
                      {t.qualityLabel}
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Weak portfolio scores</p>
              <ul className="mt-2 space-y-1 text-xs text-zinc-400">
                {portfolioSummary.weakCampaigns.length === 0 ? (
                  <li className="text-zinc-500">None flagged as WEAK.</li>
                ) : (
                  portfolioSummary.weakCampaigns.slice(0, 8).map((w) => (
                    <li key={w.campaignKey} className="rounded border border-zinc-800/60 bg-black/20 px-2 py-1">
                      <span className="font-mono text-rose-200/80">{w.campaignKey}</span> · score {w.portfolioScore}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
          {portfolioAlertsList.length > 0 ? (
            <ul className="mt-4 space-y-1 text-xs text-amber-200/90">
              {portfolioAlertsList.map((a) => (
                <li key={a.kind + a.message.slice(0, 40)}>• {a.message}</li>
              ))}
            </ul>
          ) : null}
          <div className="mt-4 space-y-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-500">Reallocation suggestions</p>
            {portfolioSummary.recommendations.length === 0 ? (
              <p className="text-xs text-zinc-500">
                No conservative pairs met thresholds — increase volume or review spend input.
              </p>
            ) : (
              portfolioSummary.recommendations.map((r, idx) => (
                <div
                  key={`${r.fromCampaignKey}-${r.toCampaignKey}-${idx}`}
                  className="rounded-lg border border-zinc-800/80 bg-black/25 px-3 py-2 text-xs text-zinc-300"
                >
                  <p className="font-medium text-zinc-100">
                    From <code className="text-indigo-200/90">{r.fromCampaignKey ?? "—"}</code> →{" "}
                    <code className="text-emerald-200/90">{r.toCampaignKey ?? "—"}</code>
                  </p>
                  <p className="mt-1 text-zinc-400">
                    Suggested shift: <span className="tabular-nums text-zinc-200">${r.amount.toFixed(2)}</span> ·
                    confidence {(r.confidenceScore * 100).toFixed(0)}%
                  </p>
                  <p className="mt-1 text-zinc-500">{r.reason}</p>
                  <ul className="mt-2 list-inside list-disc text-[11px] text-zinc-500">
                    {r.safeguards.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

      <div className="mt-4 rounded-xl border border-emerald-900/30 bg-emerald-950/10 p-4">
        <h3 className="text-sm font-semibold text-emerald-200/90">Profit-based recommendations</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Suggestions only — no auto-spend. Confidence rises with lead volume (≥3 leads required for profit math).
        </p>
        <ul className="mt-3 space-y-2">
          {profitRecommendations.length === 0 ? (
            <li className="text-xs text-zinc-500">No campaigns in window — nothing to score.</li>
          ) : (
            profitRecommendations.map((pr) => (
              <li
                key={`${pr.campaignId}-${pr.action}`}
                className="rounded-lg border border-zinc-800/80 bg-black/25 px-3 py-2 text-xs text-zinc-300"
              >
                <span className={`font-semibold ${profitRecActionClass(pr.action)}`}>{pr.action.replace(/_/g, " ")}</span>
                <span className="ml-2 font-mono text-[10px] text-zinc-500">{pr.campaignId}</span>
                <p className="mt-1 text-zinc-400">{pr.reason}</p>
                <p className="mt-1 text-[10px] uppercase text-zinc-600">
                  Confidence: {(pr.confidence * 100).toFixed(0)}%
                </p>
              </li>
            ))
          )}
        </ul>
      </div>

      <GrowthAutonomousOptimizerSection analysis={fullAnalysis} optimizer={optimizerRun} />

      {mergedAlerts.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-400/90">
            Alerts (period + profit engine)
          </p>
          <ul className="space-y-1">
            {mergedAlerts.map((a, i) => (
              <li
                key={`${a.kind}-${i}-${a.message.slice(0, 40)}`}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  a.severity === "critical"
                    ? "border-red-900/50 bg-red-950/30 text-red-100"
                    : "border-amber-900/40 bg-amber-950/20 text-amber-100/90"
                }`}
              >
                {a.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Winners / losers (by UTM campaign)</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Rules: CTR ≥ 1.5%, conversion ≥ 3%, CPL ≤ $75 when spend known; loser if CTR &lt; 1% or CPL ≥ $120.
          </p>
          <div className="mt-3 space-y-2">
            <p className="text-xs font-medium text-emerald-400/90">Winners ({winners.length})</p>
            {winners.length === 0 ? (
              <p className="text-xs text-zinc-500">None in this window.</p>
            ) : (
              <ul className="space-y-1 text-xs text-zinc-300">
                {winners.map((w) => (
                  <li key={w.campaignKey} className="rounded border border-emerald-900/30 bg-emerald-950/10 px-2 py-1">
                    <code className="text-emerald-200/90">{w.campaignKey}</code> · CTR {w.ctrPercent ?? "—"}% · conv{" "}
                    {w.conversionRatePercent ?? "—"}%
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs font-medium text-rose-400/90">Losers ({losers.length})</p>
            {losers.length === 0 ? (
              <p className="text-xs text-zinc-500">None flagged.</p>
            ) : (
              <ul className="space-y-1 text-xs text-zinc-300">
                {losers.map((l) => (
                  <li key={l.campaignKey} className="rounded border border-rose-900/30 bg-rose-950/10 px-2 py-1">
                    <code className="text-rose-200/90">{l.campaignKey}</code> · CTR {l.ctrPercent ?? "—"}%
                    {l.cpl != null ? (
                      <span className="text-zinc-500">
                        {" "}
                        · CPL ${l.cpl.toFixed(2)}
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Recommendations</h3>
          <ul className="mt-3 space-y-2 text-xs text-zinc-300">
            {recommendations.map((r, i) => (
              <li key={`${r.action}-${i}`} className="rounded-lg border border-zinc-800/80 bg-black/20 px-3 py-2">
                <span className="font-semibold text-zinc-100">{r.action.replace(/_/g, " ")}</span>
                {r.campaignKey ? (
                  <span className="ml-2 text-zinc-500">
                    · <code>{r.campaignKey}</code>
                  </span>
                ) : null}
                <p className="mt-1 text-zinc-400">{r.reason}</p>
                {r.detail ? <p className="mt-1 text-zinc-500">{r.detail}</p> : null}
                <p className="mt-1 text-[10px] uppercase text-zinc-600">Confidence: {r.confidence}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 border-t border-zinc-800/80 pt-4">
        <h3 className="text-sm font-semibold text-zinc-200">Retargeting signals</h3>
        <ul className="mt-2 grid gap-2 text-xs text-zinc-400 sm:grid-cols-3">
          <li className="rounded border border-zinc-800/60 px-2 py-1">
            <span className="text-zinc-200">Visitors</span> · {retarget.audience_visitors.count}{" "}
            <span className="text-zinc-600">— {retarget.audience_visitors.label}</span>
          </li>
          <li className="rounded border border-zinc-800/60 px-2 py-1">
            <span className="text-zinc-200">Engaged</span> · {retarget.audience_engaged.count}{" "}
            <span className="text-zinc-600">— {retarget.audience_engaged.label}</span>
          </li>
          <li className="rounded border border-zinc-800/60 px-2 py-1">
            <span className="text-zinc-200">Hot (clicked, no booking)</span> · {retarget.audience_hot.count}{" "}
            <span className="text-zinc-600">— {retarget.audience_hot.label}</span>
          </li>
        </ul>
      </div>
    </section>
  );
}
