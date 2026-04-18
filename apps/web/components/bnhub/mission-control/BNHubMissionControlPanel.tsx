"use client";

import type { BNHubMissionControlSummary } from "@/modules/bnhub/mission-control/mission-control.types";

function statusBadgeClass(s: NonNullable<BNHubMissionControlSummary["status"]>): string {
  switch (s) {
    case "strong":
      return "border-emerald-500/50 bg-emerald-500/10 text-emerald-200";
    case "healthy":
      return "border-sky-500/50 bg-sky-500/10 text-sky-100";
    case "watch":
      return "border-amber-500/50 bg-amber-500/10 text-amber-100";
    default:
      return "border-white/15 bg-white/5 text-neutral-300";
  }
}

export function BNHubMissionControlPanel({ summary }: { summary: BNHubMissionControlSummary }) {
  const st = summary.status ?? "watch";

  return (
    <div className="mt-4 rounded-xl border border-violet-500/30 bg-black/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-tight text-violet-100/95">🚀 Mission Control</h3>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${statusBadgeClass(st)}`}
        >
          {st}
        </span>
      </div>
      <p className="mt-1 text-[10px] text-neutral-500">
        Read-only advisory rollup — does not change pricing, ranking execution, bookings, or Stripe.
      </p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Ranking score" value={summary.rankingScore != null ? summary.rankingScore.toFixed(1) : "—"} />
        <Metric label="Guest conversion" value={summary.guestConversionStatus ?? "—"} />
        <Metric label="Booking health" value={summary.bookingHealth ?? "—"} />
        <Metric label="Trust (display)" value={summary.trustScore != null ? String(summary.trustScore) : "—"} />
      </div>
      <p className="mt-2 text-[10px] text-neutral-600">
        Host status: <span className="text-neutral-400">{summary.hostStatus ?? "—"}</span> · Pricing signal:{" "}
        <span className="text-neutral-400">{summary.pricingSignal ?? "—"}</span>
      </p>

      {summary.topRisks.length > 0 ? (
        <div className="mt-3 border-t border-white/10 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-rose-400/90">Top risks</p>
          <ul className="mt-1 list-inside list-disc text-[11px] text-neutral-400">
            {summary.topRisks.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {summary.topOpportunities.length > 0 ? (
        <div className="mt-3 border-t border-white/10 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-500/90">Opportunities</p>
          <ul className="mt-1 list-inside list-disc text-[11px] text-neutral-400">
            {summary.topOpportunities.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {summary.recommendations.length > 0 ? (
        <div className="mt-3 border-t border-white/10 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Recommendations</p>
          <ul className="mt-2 space-y-2">
            {summary.recommendations.map((r) => (
              <li key={r.id} className="text-[11px] text-neutral-300">
                <span className="font-medium text-violet-100/90">{r.title}</span>
                <span className="text-neutral-500"> · {r.impact} impact</span>
                <p className="mt-0.5 text-[10px] text-neutral-500">{r.description}</p>
                <p className="mt-0.5 text-[10px] text-neutral-600">{r.why}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-neutral-100 capitalize">{value}</p>
    </div>
  );
}
