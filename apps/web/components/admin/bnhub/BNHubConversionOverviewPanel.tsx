"use client";

import { useEffect, useState } from "react";
import type { BNHubConversionAdminOverview } from "@/modules/bnhub/conversion/bnhub-guest-conversion.types";

function pct(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(1)}%`;
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

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile label="Listing clicks" value={data.totals.listingClicks} />
        <Tile label="Listing views" value={data.totals.listingViews} />
        <Tile label="Booking started" value={data.totals.bookingStarted} />
        <Tile label="Booking completed" value={data.totals.bookingCompleted} />
      </div>

      <div className="mt-4 rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Funnel ratios</p>
        <ul className="mt-2 space-y-1 text-xs text-zinc-300">
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
