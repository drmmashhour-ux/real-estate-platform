import {
  V4_MIN_CLICKS_TRUST,
  V4_MIN_IMPRESSIONS_TRUST,
} from "@/services/growth/v4-safety";
import type { UserSegment } from "@/services/growth/v4-types";
import { engineFlags } from "@/config/feature-flags";
import { getGrowthV4DashboardPayload } from "@/modules/growth/growth-v4-data.service";

const RANGE_DAYS = 14;

function safeFinite(v: number | null | undefined): number | null {
  if (typeof v !== "number" || Number.isNaN(v) || !Number.isFinite(v)) return null;
  return v;
}

function fmtNum(v: number | null, digits = 2): string {
  return v === null ? "—" : v.toFixed(digits);
}

const ALL_SEGMENTS: UserSegment[] = [
  "NEW_VISITOR",
  "RETURNING_USER",
  "HIGH_INTENT",
  "ABANDONED_BOOKING",
  "HIGH_VALUE",
];

function geoLabel(geo: { country?: string; region?: string; city?: string }): string {
  const parts = [geo.city, geo.region, geo.country].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

function scalingHint(reason: string): string {
  switch (reason) {
    case "high_roas_scale":
      return "Strong ROAS: scale gradually within caps (≤30% per cycle in this engine).";
    case "moderate_scale":
      return "Healthy ROAS: modest increase or test incremental spend.";
    case "unprofitable_reduce":
      return "ROAS below 1: reduce or pause; fix targeting or creative before re-scaling.";
    case "low_efficiency":
      return "Below target efficiency: trim or optimize before scaling.";
    case "stable":
      return "Hold; monitor ROAS and volume.";
    case "insufficient_volume_hold":
      return "Below trust thresholds — gather more clicks/impressions before scaling.";
    case "no_attributed_spend":
      return "No attributed spend in window — connect UTM/manual spend before scaling.";
    default:
      return "Apply manually in your ad platforms; engine does not call Stripe or APIs.";
  }
}

export async function GrowthEngineV4Section({ userId }: { userId: string }) {
  if (!engineFlags.growthMachineV1 || !engineFlags.growthEngineV4) {
    return null;
  }

  const v4 = await getGrowthV4DashboardPayload(userId, RANGE_DAYS);
  const roasVals = v4.geoPerformance.map((g) => safeFinite(g.roas)).filter((x): x is number => x !== null);
  const maxRoas = roasVals.length > 0 ? Math.max(...roasVals, 1e-9) : 1;

  return (
    <section className="rounded-2xl border border-fuchsia-900/35 bg-fuchsia-950/15 p-5 sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-fuchsia-300/90">Growth Engine V4</p>
          <h2 className="mt-1 text-lg font-bold tracking-tight">Predictive budget · geo · personalization</h2>
        </div>
        <p className="text-xs text-zinc-500">
          Last {RANGE_DAYS} days · ROAS uses manual spend + booking revenue in event metadata when recorded · suggestions
          only
        </p>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
        Trust rules: ≥{V4_MIN_CLICKS_TRUST} clicks and ≥{V4_MIN_IMPRESSIONS_TRUST} impressions per slice before scaling
        signals apply. Budget changes are capped per cycle; geo split never assigns 100% to one region when multiple exist.
      </p>

      {/* Geo heatmap-style grid */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-zinc-200">Geo performance (heatmap)</h3>
        {v4.geoPerformance.length === 0 ? (
          <p className="mt-2 text-xs text-zinc-500">
            No grouped geo rows yet. Add `country` / `city` on client growth metadata to unlock regional ROAS.
          </p>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {v4.geoPerformance.map((g, i) => {
              const roas = safeFinite(g.roas) ?? 0;
              const ctr = safeFinite(g.ctr) ?? 0;
              const conv = safeFinite(g.conversionRate) ?? 0;
              const intensity = maxRoas > 0 ? roas / maxRoas : 0;
              return (
                <div
                  key={`${geoLabel(g.geo)}-${i}`}
                  className="rounded-lg border border-zinc-800/80 px-3 py-2 text-xs"
                  style={{
                    backgroundColor: `rgba(147, 51, 234, ${0.08 + Math.min(1, Math.max(0, intensity)) * 0.35})`,
                  }}
                >
                  <p className="font-medium text-zinc-100">{geoLabel(g.geo)}</p>
                  <p className="mt-1 text-zinc-400">
                    ROAS {fmtNum(safeFinite(g.roas))} · CTR {fmtNum(ctr * 100, 1)}% · Conv {fmtNum(conv * 100, 1)}%
                  </p>
                  <p className="mt-1 text-[10px] text-zinc-500">
                    imp {g.impressions} · clk {g.clicks} · rev ${fmtNum(safeFinite(g.revenue))} · spend $
                    {fmtNum(safeFinite(g.spend))}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Budget allocation */}
      <div className="mt-8 border-t border-zinc-800/70 pt-6">
        <h3 className="text-sm font-semibold text-zinc-200">Budget allocation panel</h3>
        <ul className="mt-3 space-y-2 text-xs">
          {v4.budgetRecommendations.length === 0 ? (
            <li className="text-zinc-500">No UTM campaigns with spend in this window.</li>
          ) : (
            v4.budgetRecommendations.map((b) => (
              <li
                key={b.campaignId}
                className="rounded-lg border border-zinc-800/80 bg-black/20 px-3 py-2 text-zinc-300"
              >
                <code className="text-fuchsia-200/90">{b.campaignId}</code>
                <span className="ml-2 text-zinc-500">
                  ${fmtNum(safeFinite(b.currentBudget))} → ${fmtNum(safeFinite(b.recommendedBudget))} (
                  {fmtNum(safeFinite(b.adjustment) != null ? (b.adjustment as number) * 100 : null, 1)}%)
                </span>
                <span className="ml-2 text-zinc-500">· {b.reason}</span>
                <span className="ml-2 text-[10px] uppercase text-zinc-600">
                  conf{" "}
                  {safeFinite(b.confidence) != null ? `${((b.confidence as number) * 100).toFixed(0)}%` : "—"} ·{" "}
                  {b.trusted ? "trusted" : "low volume"}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>

      {/* Geo budget split */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-zinc-200">Geo-based budget split</h3>
        <ul className="mt-2 space-y-1 text-xs text-zinc-400">
          {v4.geoBudgetSplit.map((row, i) => (
            <li key={`${geoLabel(row.geo)}-${i}`} className="flex flex-wrap gap-2">
              <span className="text-zinc-200">{geoLabel(row.geo)}</span>
              <span>${fmtNum(safeFinite(row.budget))}</span>
              {row.note ? <span className="text-zinc-600">— {row.note}</span> : null}
              <span className="text-[10px] text-zinc-600">{row.trusted ? "" : "low volume"}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Campaign scaling recommendations */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold text-zinc-200">Campaign scaling recommendations</h3>
        <p className="mt-1 text-[11px] text-zinc-500">
          Same ROAS + volume signals as the budget panel — suggestions only; no automatic spend.
        </p>
        {v4.budgetRecommendations.length === 0 ? null : (
          <ul className="mt-3 space-y-2 text-xs text-zinc-400">
            {v4.budgetRecommendations.map((b) => (
              <li key={`scale-${b.campaignId}`} className="rounded-lg border border-zinc-800/60 bg-black/15 px-3 py-2">
                <code className="text-fuchsia-200/80">{b.campaignId}</code>
                <span className="ml-2 text-zinc-300">{scalingHint(b.reason)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Segment + offers */}
      <div className="mt-8 grid gap-6 border-t border-zinc-800/70 pt-6 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Segment (you)</h3>
          <p className="mt-2 text-sm text-fuchsia-200/90">{v4.personalization.segment}</p>
          <p className="mt-4 text-xs font-medium text-zinc-500">Eligible segments (reference)</p>
          <ul className="mt-2 space-y-1 text-xs text-zinc-500">
            {ALL_SEGMENTS.map((s) => (
              <li key={s} className={s === v4.personalization.segment ? "text-emerald-400/90" : ""}>
                {s}
                {s === v4.personalization.segment ? " · current" : ""}
              </li>
            ))}
          </ul>
          <h4 className="mt-5 text-xs font-semibold uppercase tracking-wide text-zinc-500">Segment distribution</h4>
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
            Org-wide segment mix is not shown here — it needs a cohort job over real events (we do not fabricate
            percentages). Export events or use CRM/analytics for population-level distribution; this panel stays
            viewer-specific.
          </p>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-200">Personalized offer preview</h3>
          <div className="mt-2 rounded-lg border border-zinc-800/80 bg-black/25 p-3 text-xs text-zinc-300">
            <p className="text-sm font-semibold text-white">{v4.personalization.offer.headline}</p>
            <p className="mt-2 text-fuchsia-300/90">{v4.personalization.offer.cta}</p>
            {v4.personalization.offer.incentive ? (
              <p className="mt-2 text-zinc-500">{v4.personalization.offer.incentive}</p>
            ) : null}
            <p className="mt-3 text-[10px] text-zinc-600">
              Copy suggestions only — no price or legal changes; no fabricated urgency.
            </p>
          </div>
        </div>
      </div>

      <p className="mt-6 text-[10px] text-zinc-600">Updated {v4.timestamp}</p>
    </section>
  );
}
