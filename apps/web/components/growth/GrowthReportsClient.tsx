"use client";

import * as React from "react";

type RoiPayload = {
  windowDays: number;
  impressions: number;
  clicks: number;
  leadCount: number;
  bookingCount: number;
  revenueCents: number;
  spendCents: number;
  roiPercent: number | null;
  costPerLeadCents: number | null;
  costPerBookingCents: number | null;
  clickToLeadPercent?: number | null;
  leadToBookingPercent?: number | null;
};

type RankingInsightsPayload = {
  windowNote?: string;
  listings: {
    listingId: string;
    title: string;
    rankingScore: number;
    factors: {
      listingQuality: number;
      hostTrust: number;
      reviewStrength: number;
      conversionStrength: number;
      freshness: number;
      riskPenalty: number;
      pricingCompetitiveness: number;
    };
    reasons: string[];
  }[];
};

type InsightsPayload = {
  windowDays: number;
  funnel: {
    steps: { step: string; count: number }[];
    dropoffs: { from: string; to: string; dropPercent: number | null }[];
    weakestStep: { from: string; to: string; dropPercent: number | null } | null;
  };
  topPerformingSubjects: {
    subjectType: string;
    subjectId: string;
    revenueCents: number;
    spendCents: number;
    roiPercent: number | null;
  }[];
  worstPerformingSubjects: {
    subjectType: string;
    subjectId: string;
    revenueCents: number;
    spendCents: number;
    roiPercent: number | null;
  }[];
};

type FunnelVizPayload = {
  steps: { step: string; count: number }[];
  dropOffRates: { from: string; to: string; dropPercent: number | null }[];
  conversionRate: number | null;
};

type SoftLaunchPlanPayload = {
  targetUsers: number;
  budgetUsd: { min: number; max: number };
  channels: string[];
  weeklyPlan: { week: number; focus: string; measurableKpis: string[] }[];
  expectedCacUsd: { low: number; high: number };
  expectedConversionRatePercent: { low: number; high: number };
  actions: string[];
};

export function GrowthReportsClient({
  showRankingInsights = false,
  showSoftLaunch = false,
}: {
  showRankingInsights?: boolean;
  showSoftLaunch?: boolean;
}) {
  const [data, setData] = React.useState<RoiPayload | null>(null);
  const [insights, setInsights] = React.useState<InsightsPayload | null>(null);
  const [ranking, setRanking] = React.useState<RankingInsightsPayload | null>(null);
  const [funnelViz, setFunnelViz] = React.useState<FunnelVizPayload | null>(null);
  const [softPlan, setSoftPlan] = React.useState<SoftLaunchPlanPayload | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  React.useEffect(() => {
    void Promise.all([
      fetch("/api/marketing-system/v2/roi-summary").then((r) =>
        r.ok ? r.json() : r.json().then((j) => Promise.reject(new Error(j.error ?? "Failed")))
      ),
      fetch("/api/marketing-system/v2/insights").then((r) => (r.ok ? r.json() : null)).catch(() => null),
      showRankingInsights
        ? fetch("/api/marketing-system/v2/ranking-insights").then((r) => (r.ok ? r.json() : null))
        : Promise.resolve(null),
      showSoftLaunch
        ? fetch("/api/marketing-system/v2/funnel-visualization?preset=soft_launch").then((r) =>
            r.ok ? r.json() : null
          )
        : Promise.resolve(null),
      showSoftLaunch
        ? fetch("/api/launch/v1/soft-launch-plan").then((r) => (r.ok ? r.json() : null))
        : Promise.resolve(null),
    ])
      .then(([roi, ins, rank, viz, plan]) => {
        setData(roi);
        setInsights(ins);
        setRanking(rank);
        setFunnelViz(viz);
        setSoftPlan(plan);
      })
      .catch((e: Error) => setErr(e.message));
  }, [showRankingInsights, showSoftLaunch]);

  if (err) {
    return <p className="text-sm text-red-400">{err}</p>;
  }
  if (!data) {
    return <p className="text-sm text-zinc-500">Loading ROI & funnel…</p>;
  }

  const money = (cents: number) =>
    `$${(cents / 100).toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard label={`Impressions (${data.windowDays}d)`} value={String(data.impressions)} />
        <MetricCard label="Clicks" value={String(data.clicks)} />
        <MetricCard label="Leads (events)" value={String(data.leadCount)} />
        <MetricCard label="Bookings (events)" value={String(data.bookingCount)} />
        <MetricCard label="Revenue (reported)" value={money(data.revenueCents)} />
        <MetricCard label="Spend (reported)" value={money(data.spendCents)} />
        <MetricCard
          label="ROI %"
          value={data.roiPercent == null ? "— (need spend > 0)" : `${data.roiPercent.toFixed(1)}%`}
        />
        <MetricCard
          label="Cost / lead"
          value={data.costPerLeadCents == null ? "—" : money(data.costPerLeadCents)}
        />
        <MetricCard
          label="Cost / booking"
          value={data.costPerBookingCents == null ? "—" : money(data.costPerBookingCents)}
        />
        <MetricCard
          label="Lead ÷ click (reported)"
          value={
            data.clickToLeadPercent == null ? "— (need clicks)" : `${data.clickToLeadPercent.toFixed(1)}%`
          }
        />
        <MetricCard
          label="Booking ÷ lead (reported)"
          value={
            data.leadToBookingPercent == null ? "— (need leads)" : `${data.leadToBookingPercent.toFixed(1)}%`
          }
        />
      </div>

      {insights ? (
        <>
          <div>
            <h3 className="text-sm font-semibold text-zinc-200">Funnel (your user id, last {insights.windowDays}d)</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Steps rely on recorded funnel events (ad_click → blog_view → listing_view → lead_capture →
              booking_completed; blog_click on shares). Zeros mean no events yet for that step.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {insights.funnel.steps.map((s) => (
                <span
                  key={s.step}
                  className="rounded-lg border border-zinc-700 bg-zinc-900/60 px-2 py-1 text-xs text-zinc-300"
                >
                  {s.step}: <strong className="text-white">{s.count}</strong>
                </span>
              ))}
            </div>
            {insights.funnel.weakestStep ? (
              <p className="mt-2 text-xs text-amber-200/90">
                Largest drop: {insights.funnel.weakestStep.from} → {insights.funnel.weakestStep.to}{" "}
                {insights.funnel.weakestStep.dropPercent != null
                  ? `(${insights.funnel.weakestStep.dropPercent}% fewer)`
                  : ""}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Top subjects (revenue)</h4>
              <ul className="mt-2 space-y-1 text-xs text-zinc-400">
                {insights.topPerformingSubjects.length === 0 ? (
                  <li>No subject-attributed revenue yet.</li>
                ) : (
                  insights.topPerformingSubjects.map((s) => (
                    <li key={`${s.subjectType}:${s.subjectId}`}>
                      {s.subjectType} <code className="text-zinc-500">{s.subjectId.slice(0, 8)}…</code> · rev{" "}
                      {money(s.revenueCents)} · ROI {s.roiPercent == null ? "—" : `${s.roiPercent.toFixed(0)}%`}
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Weak ROI (spend &gt; 0)</h4>
              <ul className="mt-2 space-y-1 text-xs text-zinc-400">
                {insights.worstPerformingSubjects.length === 0 ? (
                  <li>No negative-ROI subjects detected in window.</li>
                ) : (
                  insights.worstPerformingSubjects.map((s) => (
                    <li key={`w:${s.subjectType}:${s.subjectId}`}>
                      {s.subjectType} <code className="text-zinc-500">{s.subjectId.slice(0, 8)}…</code> · ROI{" "}
                      {s.roiPercent == null ? "—" : `${s.roiPercent.toFixed(0)}%`}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </>
      ) : (
        <p className="text-xs text-zinc-600">
          Extended funnel insights unavailable (ensure you can access{" "}
          <code className="text-zinc-500">GET /api/marketing-system/v2/insights</code>).
        </p>
      )}

      {showSoftLaunch && funnelViz && funnelViz.steps.length > 0 ? (
        <div className="rounded-xl border border-emerald-900/30 bg-emerald-950/10 p-4">
          <h3 className="text-sm font-semibold text-emerald-100">Soft-launch funnel (preset)</h3>
          <p className="mt-1 text-xs text-emerald-200/70">
            ad_click → landing_view → cta_click → listing_view → lead_capture → booking_completed — rates from your
            stored FUNNEL events only.
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            End-to-end conversion (last ÷ first step):{" "}
            <strong className="text-white">
              {funnelViz.conversionRate == null ? "—" : `${(funnelViz.conversionRate * 100).toFixed(2)}%`}
            </strong>
          </p>
          <div className="mt-4 space-y-2">
            {(() => {
              const max = Math.max(1, ...funnelViz.steps.map((s) => s.count));
              return funnelViz.steps.map((s) => (
                <div key={s.step} className="flex items-center gap-3 text-xs">
                  <span className="w-36 shrink-0 text-zinc-400">{s.step}</span>
                  <div className="h-2 min-w-0 flex-1 rounded-full bg-zinc-800">
                    <div
                      className="h-2 rounded-full bg-emerald-600/90"
                      style={{ width: `${Math.max(4, (s.count / max) * 100)}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-zinc-200">{s.count}</span>
                </div>
              ));
            })()}
          </div>
        </div>
      ) : null}

      {showSoftLaunch && softPlan ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h3 className="text-sm font-semibold text-zinc-200">Soft launch strategy (planning band)</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Target {softPlan.targetUsers} users · budget planning ${softPlan.budgetUsd.min}–${softPlan.budgetUsd.max}{" "}
            USD · illustrative CAC ${softPlan.expectedCacUsd.low}–${softPlan.expectedCacUsd.high} (measure real CAC from
            events).
          </p>
          <p className="mt-2 text-xs text-zinc-500">Channels: {softPlan.channels.join(" · ")}</p>
          <ul className="mt-3 list-inside list-disc text-xs text-zinc-400">
            {softPlan.actions.slice(0, 5).map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {ranking && ranking.listings.length > 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h3 className="text-sm font-semibold text-zinc-200">Listing ranking insights (BNHub hosts)</h3>
          {ranking.windowNote ? <p className="mt-1 text-xs text-zinc-500">{ranking.windowNote}</p> : null}
          <ul className="mt-3 space-y-3 text-xs text-zinc-300">
            {ranking.listings.map((row) => (
              <li key={row.listingId} className="border-b border-zinc-800/80 pb-3 last:border-0">
                <div className="font-medium text-zinc-100">{row.title.slice(0, 72)}</div>
                <div className="mt-1 text-zinc-400">
                  Score <strong className="text-white">{row.rankingScore}</strong>
                  <span className="ml-2 text-zinc-500">
                    Q {row.factors.listingQuality?.toFixed(0) ?? "—"} · trust {row.factors.hostTrust?.toFixed(0) ?? "—"}{" "}
                    · reviews {row.factors.reviewStrength?.toFixed(0) ?? "—"}
                  </span>
                </div>
                {row.reasons.length ? (
                  <ul className="mt-2 list-inside list-disc text-zinc-500">
                    {row.reasons.slice(0, 4).map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : showRankingInsights ? (
        <p className="text-xs text-zinc-600">
          No BNHub listings found for ranking preview, or insights empty. Publish a stay to see factor breakdowns.
        </p>
      ) : null}

      <p className="text-xs text-zinc-500">
        Explainable campaign hints (no auto-apply):{" "}
        <code className="text-zinc-400">GET /api/marketing-system/v2/optimize</code> — uses ROI, funnel drop-offs, and
        performance aggregates for the signed-in user.
      </p>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}
