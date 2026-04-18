"use client";

import type {
  BNHubListingConversionSummaryV1,
  BnhubWeakestFunnelStep,
} from "@/modules/bnhub/conversion/bnhub-guest-conversion.types";
import { hostActionLineForWeakest } from "@/modules/bnhub/conversion/bnhub-conversion-funnel-diagnostics";

function pct(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

function rateHighlight(step: BnhubWeakestFunnelStep | null, key: "ctr" | "view" | "start" | "paid"): boolean {
  if (!step) return false;
  const map: Record<Exclude<BnhubWeakestFunnelStep, null>, typeof key> = {
    search_click: "ctr",
    click_view: "view",
    view_start: "start",
    start_paid: "paid",
  };
  return map[step] === key;
}

/**
 * BNHub guest conversion funnel (V1) — advisory metrics for hosts.
 */
export function HostConversionPanel({ summary }: { summary: BNHubListingConversionSummaryV1 }) {
  const m = summary.metrics;
  const parity = summary.trackingParity;
  const biggest = summary.biggestIssue;
  const w = summary.weakestStep;
  const topThreeActions =
    summary.quickWins.length > 0 ? summary.quickWins.slice(0, 3) : summary.recommendations.slice(0, 3);

  return (
    <div className="mt-4 rounded-xl border border-sky-500/25 bg-sky-500/5 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-300/90">Guest conversion (V1)</p>
      <p className="mt-1 text-[10px] text-neutral-500">Advisory funnel — no automatic listing or price changes.</p>

      {!parity.aligned ? (
        <div className="mt-3 rounded-lg border border-amber-600/40 bg-amber-950/40 px-2.5 py-2 text-[11px] leading-snug text-amber-100">
          <span className="font-semibold text-amber-50">Tracking parity off.</span> Enable both{" "}
          <code className="rounded bg-black/40 px-1 font-mono text-[10px]">FEATURE_BNHUB_CONVERSION_V1</code> and{" "}
          <code className="rounded bg-black/40 px-1 font-mono text-[10px]">
            NEXT_PUBLIC_FEATURE_BNHUB_CONVERSION_V1
          </code>{" "}
          for trustworthy funnel conclusions (server UI + client beacon).
          <span className="mt-1 block text-[10px] text-amber-200/80">
            Server: {parity.serverUi ? "on" : "off"} · Client beacon: {parity.clientBeacon ? "on" : "off"}
          </span>
        </div>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <Metric label="Search views (ctx.)" value={String(m.impressions)} />
        <Metric label="Clicks" value={String(m.clicks)} />
        <Metric label="Listing views" value={String(m.views)} />
        <Metric label="Booking starts" value={String(m.bookingStarts)} />
        <Metric label="Paid completions" value={String(m.bookingsCompleted)} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label="Click rate (search→click)" value={pct(m.ctr)} highlight weakest={rateHighlight(w, "ctr")} />
        <Metric label="Listing view rate (click→view)" value={pct(m.viewRate)} highlight weakest={rateHighlight(w, "view")} />
        <Metric label="Start rate (view→start)" value={pct(m.viewToStartRate)} highlight weakest={rateHighlight(w, "start")} />
        <Metric label="Completion rate (start→paid)" value={pct(m.startToPaidRate)} highlight weakest={rateHighlight(w, "paid")} />
      </div>

      {summary.issueLabel ? (
        <div className="mt-3 rounded-lg border border-rose-500/35 bg-rose-950/25 px-2.5 py-2">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-rose-200/90">Main issue for this listing</p>
          <p className="mt-1 text-sm font-semibold text-rose-50">{summary.issueLabel}</p>
          {summary.dropOffAtWeakestStep != null ? (
            <p className="mt-1 text-[10px] text-rose-200/80">
              Estimated drop-off at weakest step: {(summary.dropOffAtWeakestStep * 100).toFixed(1)}% (from tracked counts)
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="mt-3 rounded-lg border border-violet-500/25 bg-violet-950/20 px-2.5 py-2">
        <p className="text-[9px] font-semibold uppercase tracking-wide text-violet-300/90">What to fix first</p>
        <p className="mt-1 text-[11px] leading-snug text-neutral-200">{hostActionLineForWeakest(summary.weakestStep)}</p>
      </div>

      <div className="mt-3 rounded-lg border border-white/10 bg-black/25 px-2.5 py-2">
        <p className="text-[9px] font-semibold uppercase tracking-wide text-violet-300/90">Weakest funnel step</p>
        <p className="mt-1 text-xs font-semibold text-white">
          {summary.weakestStepLabel ?? "Not enough volume yet"}
        </p>
        <p className="mt-1 text-[11px] text-neutral-400">Largest relative drop-off in your current signal window.</p>
      </div>

      {biggest ? (
        <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-950/30 px-2.5 py-2">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-amber-200/90">Biggest issue (ranked)</p>
          <p className="mt-1 text-xs font-semibold text-amber-50">{biggest.title}</p>
          <p className="mt-0.5 text-[11px] text-amber-100/85">{biggest.description}</p>
          <p className="mt-1 text-[10px] uppercase text-amber-200/60">Severity: {biggest.severity}</p>
        </div>
      ) : null}

      {summary.alerts.length > 0 ? (
        <div className="mt-3 border-t border-white/10 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-red-300/90">Alerts</p>
          <ul className="mt-2 space-y-2">
            {summary.alerts.map((a) => (
              <li
                key={a.code}
                className={`rounded-lg border px-2 py-1.5 text-[11px] leading-snug ${
                  a.severity === "critical"
                    ? "border-red-600/50 bg-red-950/35 text-red-50"
                    : "border-amber-600/40 bg-amber-950/25 text-amber-50"
                }`}
              >
                {a.message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {summary.quickWins.length > 0 ? (
        <div className="mt-3 border-t border-white/10 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-200/90">Quick improve</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-[11px] text-neutral-300">
            {summary.quickWins.map((r, idx) => (
              <li key={idx}>{r}</li>
            ))}
          </ol>
        </div>
      ) : null}

      {summary.insights.length > 0 ? (
        <div className="mt-4 border-t border-white/10 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-200/90">All insights</p>
          <ul className="mt-2 space-y-2">
            {summary.insights.map((i) => (
              <li key={i.id} className="text-xs text-neutral-300">
                <span className="font-semibold text-white">{i.title}</span>
                <span className={`ml-2 text-[10px] uppercase text-neutral-500`}>({i.severity})</span>
                <p className="mt-0.5 text-[11px] text-neutral-500">{i.description}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {topThreeActions.length > 0 ? (
        <div className="mt-4 border-t border-white/10 pt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-200/90">Top 3 actions</p>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-[11px] text-neutral-300">
            {topThreeActions.map((r, idx) => (
              <li key={idx}>{r}</li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  );
}

function Metric({
  label,
  value,
  highlight,
  weakest,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  weakest?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border px-2 py-1.5 ${
        weakest
          ? "border-amber-500/50 bg-amber-950/30 ring-1 ring-amber-500/30"
          : highlight
            ? "border-emerald-500/25 bg-emerald-500/10"
            : "border-white/10 bg-black/20"
      }`}
    >
      <p className="text-[9px] uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-0.5 font-mono text-sm tabular-nums text-neutral-100">{value}</p>
    </div>
  );
}
