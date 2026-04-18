"use client";

import type { BNHubGuestConversionSummary } from "@/modules/bnhub/guest-conversion/guest-conversion.types";

function statusBadgeClass(status: BNHubGuestConversionSummary["status"]): string {
  switch (status) {
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

function fmtPct(n: number | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  return `${n.toFixed(1)}%`;
}

export function GuestConversionPanel({
  summary,
  showFriction,
  showRecommendations,
}: {
  summary: BNHubGuestConversionSummary;
  showFriction: boolean;
  showRecommendations: boolean;
}) {
  const s = summary.searchMetrics;
  const l = summary.listingMetrics;

  return (
    <div className="mt-4 rounded-xl border border-cyan-500/25 bg-black/35 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-tight text-cyan-100/95">🧲 Guest conversion</h3>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${statusBadgeClass(summary.status)}`}
        >
          {summary.status}
        </span>
      </div>
      <p className="mt-1 text-[10px] text-neutral-500">
        Advisory only — does not change ranking, pricing, or checkout. Metrics use BNHub client events when present.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Search metrics</p>
          <ul className="mt-1 space-y-0.5 text-[11px] text-neutral-400">
            <li>Impressions (discovery-context): {s?.impressions ?? "—"}</li>
            <li>Clicks (discovery targets): {s?.clicks ?? "—"}</li>
            <li>CTR: {fmtPct(s?.clickThroughRate)}</li>
          </ul>
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Listing funnel</p>
          <ul className="mt-1 space-y-0.5 text-[11px] text-neutral-400">
            <li>Views: {l?.listingViews ?? "—"}</li>
            <li>Booking starts: {l?.bookingStarts ?? "—"}</li>
            <li>Paid completions: {l?.bookingCompletions ?? "—"}</li>
            <li>View → start: {fmtPct(l?.viewToStartRate)}</li>
            <li>Start → paid: {fmtPct(l?.startToBookingRate)}</li>
          </ul>
        </div>
      </div>

      {summary.weakSignals.length > 0 ? (
        <div className="mt-3 border-t border-white/10 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-500/90">Data notes</p>
          <ul className="mt-1 list-inside list-disc text-[11px] text-neutral-500">
            {summary.weakSignals.slice(0, 4).map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {showFriction && summary.frictionSignals.length > 0 ? (
        <div className="mt-3 border-t border-white/10 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Friction signals</p>
          <ul className="mt-2 space-y-2">
            {summary.frictionSignals.slice(0, 4).map((f) => (
              <li key={f.title} className="text-[11px] text-neutral-300">
                <span className="font-medium text-white">{f.title}</span>
                <span className="text-neutral-500"> · {f.severity}</span>
                <p className="mt-0.5 text-[10px] text-neutral-500">{f.why}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {showRecommendations && summary.recommendations.length > 0 ? (
        <div className="mt-3 border-t border-white/10 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Recommendations</p>
          <ul className="mt-2 space-y-2">
            {summary.recommendations.slice(0, 4).map((r) => (
              <li key={r.id} className="text-[11px] text-neutral-300">
                <span className="font-medium text-cyan-100/90">{r.title}</span>
                <span className="text-neutral-500"> · {r.impact} impact · {r.category}</span>
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
