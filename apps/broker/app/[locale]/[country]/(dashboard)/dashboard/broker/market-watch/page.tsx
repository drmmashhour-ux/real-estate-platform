"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatTrendPct } from "@/lib/market/trends";
import type { MarketPulseResponse } from "@/lib/market/snapshot";

type PulseState = MarketPulseResponse & { persisted?: boolean };

function TrendBadge({ pct }: { pct: number }) {
  if (!Number.isFinite(pct) || pct === 0) {
    return <span className="text-xs text-white/40">—</span>;
  }
  const up = pct > 0;
  return (
    <span className={up ? "text-xs text-emerald-400" : "text-xs text-rose-400"}>
      {up ? "▲" : "▼"} {formatTrendPct(pct)}
    </span>
  );
}

function MetricCard({ label, value, trend }: { label: string; value: number | null; trend?: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/80 p-4 text-center shadow-lg shadow-black/40">
      <div className="text-xs text-white/60">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-[#D4AF37]">{value ?? "—"}</div>
      {trend !== undefined ? (
        <div className="mt-1 flex justify-center">
          <TrendBadge pct={trend} />
        </div>
      ) : null}
    </div>
  );
}

function SmallCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: number | null;
  trend?: number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-zinc-950/90 p-4">
      <div className="text-[11px] uppercase tracking-wide text-white/50">{label}</div>
      <div className="mt-1 flex items-baseline justify-between gap-2">
        <span className="text-lg font-medium text-[#D4AF37]">{value ?? "—"}</span>
        {trend !== undefined ? <TrendBadge pct={trend} /> : null}
      </div>
    </div>
  );
}

export default function MarketWatchPage() {
  const [data, setData] = useState<PulseState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/market/snapshot", { method: "GET", credentials: "include" });
      const json = (await res.json()) as PulseState & { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        setData(null);
        setError(json.error ?? "Failed to load pulse");
        return;
      }
      setData(json);
    } catch {
      setError("Network error");
      setData(null);
    }
  }, []);

  const recordPulse = useCallback(async () => {
    setRecording(true);
    setError(null);
    try {
      const res = await fetch("/api/market/snapshot", { method: "POST", credentials: "include" });
      const json = (await res.json()) as PulseState & { success?: boolean; error?: string };
      if (!res.ok || !json.success) {
        setError(json.error ?? "Failed to record pulse");
        return;
      }
      setData(json);
    } catch {
      setError("Network error");
    } finally {
      setRecording(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 60_000);
    return () => clearInterval(interval);
  }, [load]);

  const s = data?.snapshot;
  const t = data?.trends;
  const activityScore =
    (s?.visitorsCount ?? 0) + (s?.reservationsCount ?? 0) + (s?.listingsCount ?? 0);

  const meta =
    s?.metadata && typeof s.metadata === "object" && !Array.isArray(s.metadata)
      ? (s.metadata as Record<string, unknown>)
      : null;

  return (
    <div className="min-h-screen space-y-8 bg-zinc-950 p-6 text-white">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#D4AF37]">Real Estate Watch</h1>
          <p className="mt-1 max-w-2xl text-sm text-white/60">
            Live market pulse — platform intelligence refreshes every minute. Record a pulse to log history and
            run spike detection.
          </p>
          <p className="mt-2 text-xs text-white/50">{data?.scopeNote ?? "Loading data scope…"}</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10"
          >
            Refresh now
          </button>
          <button
            type="button"
            disabled={recording}
            onClick={() => void recordPulse()}
            className="rounded-xl bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            {recording ? "Recording…" : "Record pulse (persist)"}
          </button>
          <Link
            href="/dashboard/broker/market-watch/zones"
            className="text-center text-sm text-[#D4AF37]/90 underline-offset-2 hover:underline"
          >
            Live activity zones map →
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {s && t ? (
        <>
          <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/40">
            {data?.dataScopeLabel ?? "Platform Data Only"}
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-lg">
            <div className="absolute left-1/2 top-0 z-10 w-[46%] -translate-x-1/2 -translate-y-1">
              <MetricCard label="Visitors today" value={s.visitorsCount} trend={t.visitorsPct} />
            </div>
            <div className="absolute right-0 top-1/2 z-10 w-[46%] -translate-y-1/2 translate-x-1">
              <MetricCard label="BNHub reservations" value={s.reservationsCount} trend={t.reservationsPct} />
            </div>
            <div className="absolute bottom-0 left-1/2 z-10 w-[46%] -translate-x-1/2 translate-y-1">
              <MetricCard label="Listings today" value={s.listingsCount} trend={t.listingsPct} />
            </div>
            <div className="absolute left-0 top-1/2 z-10 w-[46%] -translate-x-1/2 -translate-y-1/2">
              <MetricCard
                label="Properties sold (verified FSBO)"
                value={s.soldCount}
                trend={t.soldPct}
              />
            </div>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-full border border-[#D4AF37]/35 bg-black/85 px-6 py-5 text-center shadow-xl">
                <div className="text-[10px] font-semibold uppercase tracking-[0.35em] text-[#D4AF37]/90">
                  Live market
                </div>
                <div className="mt-2 text-2xl font-bold text-white">{activityScore}</div>
                <div className="mt-0.5 text-[10px] text-white/45">activity score</div>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#D4AF37]/90">
              Expanded analytics
            </h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <SmallCard label="Deals detected" value={s.dealsDetected} trend={t.dealsPct} />
              <SmallCard label="Buy-box matches" value={s.buyBoxMatches} trend={t.buyBoxPct} />
              <SmallCard label="Platform activity score" value={activityScore} />
            </div>
          </div>

          <div className="grid gap-4 rounded-2xl border border-white/10 bg-black/40 p-4 text-sm text-white/70 lg:grid-cols-2">
            <div>
              <div className="font-semibold text-[#D4AF37]">Market intelligence (scoped)</div>
              <p className="mt-2 leading-relaxed">
                {typeof meta?.velocityNote === "string" ? meta.velocityNote : "—"}
              </p>
            </div>
            <div>
              <div className="font-semibold text-[#D4AF37]">Price movement</div>
              <p className="mt-2 leading-relaxed">
                {typeof meta?.priceTrendNote === "string" ? meta.priceTrendNote : "—"}
              </p>
            </div>
          </div>
        </>
      ) : !error ? (
        <p className="text-sm text-white/50">Loading pulse…</p>
      ) : null}
    </div>
  );
}
