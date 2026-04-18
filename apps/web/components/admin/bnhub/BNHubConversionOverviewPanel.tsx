"use client";

import { useEffect, useState } from "react";
import type {
  BNHubConversionAdminOverview,
  BnhubWeakestFunnelStep,
} from "@/modules/bnhub/conversion/bnhub-guest-conversion.types";

function pct(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
}

function weakestShort(label: string | null): string {
  if (!label) return "—";
  const map: Record<string, string> = {
    "Search → click (discovery)": "Search→click",
    "Click → listing view": "Click→view",
    "Listing view → booking start": "View→start",
    "Booking start → paid completion": "Start→paid",
  };
  return map[label] ?? label;
}

function funnelFocusClass(label: string | null): string {
  if (!label) return "border-zinc-800 bg-zinc-950/40 text-zinc-400";
  return "border-amber-600/50 bg-amber-950/35 text-amber-100";
}

export function BNHubConversionOverviewPanel() {
  const [data, setData] = useState<BNHubConversionAdminOverview | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/bnhub/conversion-overview?windowDays=30", { credentials: "same-origin" })
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (cancelled) return;
        if (!ok) {
          setErr(typeof j?.error === "string" ? j.error : "Failed to load");
          return;
        }
        setData(j as BNHubConversionAdminOverview);
      })
      .catch(() => {
        if (!cancelled) setErr("Network error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (err) {
    return (
      <section className="rounded-2xl border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-200">
        BNHub conversion overview: {err}
      </section>
    );
  }

  if (!data) {
    return (
      <section className="rounded-2xl border border-zinc-800 bg-[#111] p-4 text-sm text-zinc-400">
        Loading BNHub conversion overview…
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-800 bg-[#111] p-5 text-zinc-100">
      <h2 className="text-sm font-semibold text-zinc-200">BNHub conversion (signals)</h2>
      <p className="mt-1 text-xs text-zinc-500">
        Rollup from <code className="text-zinc-400">ai_conversion_signals</code> — last {data.windowDays}d. Read-only.
      </p>
      <p className="mt-1 text-[10px] text-zinc-600">Generated {data.generatedAt}</p>

      <div className="mt-4 rounded-xl border border-zinc-700/80 bg-zinc-950/40 px-3 py-2.5 text-[11px] leading-snug text-zinc-400">
        <span className="font-semibold text-zinc-300">Rollout parity:</span> trustworthy funnel conclusions require{" "}
        <code className="rounded bg-black/50 px-1 font-mono text-[10px] text-emerald-300">FEATURE_BNHUB_CONVERSION_V1=1</code>{" "}
        and{" "}
        <code className="rounded bg-black/50 px-1 font-mono text-[10px] text-emerald-300">
          NEXT_PUBLIC_FEATURE_BNHUB_CONVERSION_V1=1
        </code>{" "}
        together (server/UI + client beacon).
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Tile label="Search views (ctx.)" value={data.totals.searchViews} />
        <Tile label="Listing clicks" value={data.totals.listingClicks} />
        <Tile label="Listing views" value={data.totals.listingViews} />
        <Tile label="Booking started" value={data.totals.bookingStarted} />
        <Tile label="Booking completed" value={data.totals.bookingCompleted} />
      </div>

      <div className="mt-4 rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Funnel ratios</p>
        <ul className="mt-2 space-y-1 text-xs text-zinc-300">
          <li>
            Search → click: <span className="font-mono text-emerald-300">{pct(data.funnel.searchToClick)}</span>
          </li>
          <li>
            Click → view: <span className="font-mono text-emerald-300">{pct(data.funnel.clickToView)}</span>
          </li>
          <li>
            View → booking start: <span className="font-mono text-emerald-300">{pct(data.funnel.viewToBookingStart)}</span>
          </li>
          <li>
            Start → completed: <span className="font-mono text-emerald-300">{pct(data.funnel.startToCompleted)}</span>
          </li>
        </ul>
      </div>

      <FunnelStageBars funnel={data.funnel} weakestStep={data.globalDropOff?.weakestStep ?? null} />

      {data.globalDropOff?.weakestStep ? (
        <div className="mt-4 rounded-xl border border-red-900/50 bg-red-950/30 px-3 py-2.5 text-[11px] leading-snug text-red-100">
          <span className="font-semibold text-red-50">Global weakest funnel step:</span>{" "}
          {data.globalDropOff.weakestStepLabel ?? "—"}
          {data.globalDropOff.dropOffRate != null ? (
            <>
              {" "}
              — estimated drop-off ~{(data.globalDropOff.dropOffRate * 100).toFixed(1)}% at this transition (rule-based,
              volume guards).
            </>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-[11px] text-zinc-500">
          Global weakest step: not enough volume across stages yet — keep collecting signals.
        </p>
      )}

      {data.measurementComparison ? (
        <div className="mt-4 rounded-xl border border-zinc-700/80 bg-zinc-950/40 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Before / after (same-length windows)</p>
          <p className="mt-1 text-[10px] text-zinc-600">{data.measurementComparison.previousWindowLabel}</p>
          <ul className="mt-3 space-y-2 text-[11px] text-zinc-400">
            <li className="flex flex-wrap justify-between gap-2">
              <span>Search→click</span>
              <span className="font-mono text-zinc-300">{deltaLabel(data.measurementComparison.deltaPercentagePoints.searchToClick)}</span>
            </li>
            <li className="flex flex-wrap justify-between gap-2">
              <span>Click→view</span>
              <span className="font-mono text-zinc-300">{deltaLabel(data.measurementComparison.deltaPercentagePoints.clickToView)}</span>
            </li>
            <li className="flex flex-wrap justify-between gap-2">
              <span>View→start</span>
              <span className="font-mono text-zinc-300">{deltaLabel(data.measurementComparison.deltaPercentagePoints.viewToBookingStart)}</span>
            </li>
            <li className="flex flex-wrap justify-between gap-2">
              <span>Start→paid</span>
              <span className="font-mono text-zinc-300">{deltaLabel(data.measurementComparison.deltaPercentagePoints.startToCompleted)}</span>
            </li>
          </ul>
          <p className="mt-2 text-[10px] text-zinc-600">
            Positive delta = higher conversion in the current window vs the prior period (percentage points).
          </p>
        </div>
      ) : null}

      {data.listingFunnelRows.length > 0 ? (
        <div className="mt-6">
          <p className="text-xs font-semibold text-zinc-300">Per-listing funnel (volume thresholds)</p>
          <p className="mt-1 text-[10px] text-zinc-500">
            Rates are derived from stored signals — highlight shows the largest drop-off stage for that listing.
          </p>
          <div className="mt-3 overflow-x-auto rounded-xl border border-zinc-800">
            <table className="min-w-[920px] w-full border-collapse text-left text-[11px] text-zinc-300">
              <thead className="bg-zinc-950/80 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="border-b border-zinc-800 px-2 py-2">Listing</th>
                  <th className="border-b border-zinc-800 px-2 py-2">Search views</th>
                  <th className="border-b border-zinc-800 px-2 py-2">Clicks</th>
                  <th className="border-b border-zinc-800 px-2 py-2">Views</th>
                  <th className="border-b border-zinc-800 px-2 py-2">Starts</th>
                  <th className="border-b border-zinc-800 px-2 py-2">Paid</th>
                  <th className="border-b border-zinc-800 px-2 py-2">Click rate</th>
                  <th className="border-b border-zinc-800 px-2 py-2">View rate</th>
                  <th className="border-b border-zinc-800 px-2 py-2">Start rate</th>
                  <th className="border-b border-zinc-800 px-2 py-2">Completion</th>
                  <th className="border-b border-zinc-800 px-2 py-2">Weakest step</th>
                </tr>
              </thead>
              <tbody>
                {data.listingFunnelRows.map((row) => (
                  <tr key={row.listingId} className="border-b border-zinc-800/80 last:border-0">
                    <td className="max-w-[200px] px-2 py-2 align-top">
                      <span className="block truncate font-medium text-zinc-200">
                        {row.title ?? row.listingId.slice(0, 8)}
                      </span>
                      {row.city ? <span className="text-[10px] text-zinc-600"> · {row.city}</span> : null}
                    </td>
                    <td className="px-2 py-2 font-mono tabular-nums">{row.searchViews}</td>
                    <td className="px-2 py-2 font-mono tabular-nums">{row.clicks}</td>
                    <td className="px-2 py-2 font-mono tabular-nums">{row.listingViews}</td>
                    <td className="px-2 py-2 font-mono tabular-nums">{row.bookingStarts}</td>
                    <td className="px-2 py-2 font-mono tabular-nums">{row.bookingsCompleted}</td>
                    <td className={`px-2 py-2 font-mono tabular-nums ${row.weakestStep === "search_click" ? "bg-red-950/45 text-red-100" : ""}`}>
                      {pct(row.clickRate)}
                    </td>
                    <td className={`px-2 py-2 font-mono tabular-nums ${row.weakestStep === "click_view" ? "bg-red-950/45 text-red-100" : ""}`}>
                      {pct(row.listingViewRate)}
                    </td>
                    <td className={`px-2 py-2 font-mono tabular-nums ${row.weakestStep === "view_start" ? "bg-red-950/45 text-red-100" : ""}`}>
                      {pct(row.startRate)}
                    </td>
                    <td className={`px-2 py-2 font-mono tabular-nums ${row.weakestStep === "start_paid" ? "bg-red-950/45 text-red-100" : ""}`}>
                      {pct(row.completionRate)}
                    </td>
                    <td className="px-2 py-2 align-top">
                      <span
                        className={`inline-flex max-w-[160px] rounded-lg border px-2 py-1 text-[10px] leading-snug ${funnelFocusClass(row.weakestStepLabel)}`}
                      >
                        {weakestShort(row.weakestStepLabel)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div>
          <p className="text-xs font-semibold text-zinc-300">Top listings (completed signals)</p>
          <ul className="mt-2 space-y-2 text-xs text-zinc-400">
            {data.topByBookings.length === 0 ? (
              <li>No booking_completed signals in window.</li>
            ) : (
              data.topByBookings.map((t) => (
                <li key={t.listingId} className="flex justify-between gap-2 border-b border-zinc-800/80 pb-2">
                  <span className="min-w-0 truncate">
                    {t.title ?? t.listingId}{" "}
                    {t.city ? <span className="text-zinc-600">· {t.city}</span> : null}
                  </span>
                  <span className="shrink-0 font-mono text-emerald-300">{t.count}</span>
                </li>
              ))
            )}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold text-zinc-300">Weakest (views, no completions)</p>
          <ul className="mt-2 space-y-2 text-xs text-zinc-400">
            {data.weakestByViews.length === 0 ? (
              <li>No high-view / zero-completion listings in window.</li>
            ) : (
              data.weakestByViews.map((w) => (
                <li key={w.listingId} className="flex justify-between gap-2 border-b border-zinc-800/80 pb-2">
                  <span className="min-w-0 truncate">
                    {w.title ?? w.listingId}
                    {w.city ? <span className="text-zinc-600"> · {w.city}</span> : null}
                  </span>
                  <span className="shrink-0 font-mono text-amber-200">
                    {w.views} views
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-zinc-100">{value}</p>
    </div>
  );
}
