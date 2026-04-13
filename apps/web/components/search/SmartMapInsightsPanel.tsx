"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MapListing } from "@/components/map/MapListing";
import { computeMapSearchStats, priceHistogram } from "@/lib/search/map-search-analytics";

type Props = {
  listings: MapListing[];
  dealKind: "sale" | "rent";
  cityHint?: string;
  /** Total result count from API (may exceed pins on map). */
  totalListed?: number;
  variant?: "dark" | "light";
};

export function SmartMapInsightsPanel({
  listings,
  dealKind,
  cityHint,
  totalListed,
  variant = "dark",
}: Props) {
  const stats = useMemo(() => computeMapSearchStats(listings), [listings]);
  const chartData = useMemo(() => priceHistogram(listings), [listings]);
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiSource, setAiSource] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [question, setQuestion] = useState("");

  const fmt = useCallback(
    (n: number) => {
      const s = Math.round(n).toLocaleString("en-CA");
      return dealKind === "rent" ? `$${s}/mo` : `$${s}`;
    },
    [dealKind]
  );

  const loadAi = useCallback(
    async (userQuestion?: string) => {
      if (!stats) return;
      setAiLoading(true);
      setAiError(null);
      try {
        const r = await fetch("/api/ai/map-insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dealKind,
            city: cityHint?.trim() || undefined,
            stats,
            userQuestion: userQuestion?.trim() || undefined,
          }),
        });
        const j = (await r.json()) as { ok?: boolean; text?: string; source?: string; error?: string };
        if (!r.ok || !j.ok || typeof j.text !== "string") {
          setAiError(j.error ?? "Could not load insights.");
          return;
        }
        setAiText(j.text);
        setAiSource(typeof j.source === "string" ? j.source : null);
      } catch {
        setAiError("Network error — try again.");
      } finally {
        setAiLoading(false);
      }
    },
    [stats, dealKind, cityHint]
  );

  useEffect(() => {
    setAiText(null);
    setAiSource(null);
    setAiError(null);
  }, [listings, dealKind, cityHint]);

  const dark = variant === "dark";
  const card = dark
    ? "rounded-2xl border border-white/10 bg-[#111]/95 p-4 text-white shadow-lg backdrop-blur-sm"
    : "rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-sm";
  const muted = dark ? "text-slate-400" : "text-slate-600";
  const label = dark ? "text-slate-500" : "text-slate-500";

  if (!stats || listings.length === 0) {
    return (
      <div className={card}>
        <p className={`text-sm font-semibold ${dark ? "text-premium-gold" : "text-amber-800"}`}>Smart map</p>
        <p className={`mt-2 text-sm ${muted}`}>
          Pan the map or widen filters to show listings with coordinates — stats and AI insights appear when pins are
          available.
        </p>
      </div>
    );
  }

  return (
    <div className={`${card} space-y-4`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-bold uppercase tracking-[0.2em] ${dark ? "text-premium-gold" : "text-amber-800"}`}>
            Smart map
          </p>
          <h3 className="mt-1 text-lg font-semibold">This view</h3>
          <p className={`mt-1 text-sm ${muted}`}>
            {dealKind === "rent" ? "Long-term rent" : "For sale"} · {stats.count} pin{stats.count === 1 ? "" : "s"} on map
            {totalListed != null && totalListed > stats.count ? (
              <span> ({totalListed.toLocaleString("en-CA")} total matches — some lack map coordinates)</span>
            ) : null}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-right sm:grid-cols-4">
          <StatBox label="Median" value={fmt(stats.medianPrice)} dark={dark} />
          <StatBox label="Low" value={fmt(stats.minPrice)} dark={dark} />
          <StatBox label="High" value={fmt(stats.maxPrice)} dark={dark} />
          <StatBox label="Sold / pending" value={`${stats.soldCount} / ${stats.pendingCount}`} dark={dark} />
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className={dark ? "rounded-xl border border-white/10 bg-black/40 p-2" : "rounded-xl border border-slate-100 bg-slate-50 p-2"}>
          <p className={`mb-2 px-2 text-xs font-semibold uppercase tracking-wide ${label}`}>Price mix on map</p>
          <div className="h-36 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: dark ? "#94a3b8" : "#64748b" }} interval={0} angle={-18} textAnchor="end" height={48} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: dark ? "#94a3b8" : "#64748b" }} width={28} />
                <Tooltip
                  contentStyle={{
                    background: dark ? "#1a1a1a" : "#fff",
                    border: dark ? "1px solid #333" : "1px solid #e2e8f0",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: dark ? "#e2e8f0" : "#334155" }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((e, i) => (
                    <Cell key={i} fill={e.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}

      <div className={dark ? "rounded-xl border border-premium-gold/25 bg-premium-gold/[0.06] p-3" : "rounded-xl border border-amber-200 bg-amber-50/80 p-3"}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className={`text-sm font-semibold ${dark ? "text-premium-gold" : "text-amber-900"}`}>AI map assistant</p>
          <button
            type="button"
            disabled={aiLoading}
            onClick={() => void loadAi()}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition disabled:opacity-50 ${
              dark ? "bg-premium-gold text-black hover:brightness-110" : "bg-amber-600 text-white hover:bg-amber-700"
            }`}
          >
            {aiLoading ? "Thinking…" : aiText ? "Refresh" : "Summarize this area"}
          </button>
        </div>
        {aiText ? (
          <p className={`mt-2 text-sm leading-relaxed ${dark ? "text-slate-200" : "text-slate-800"}`}>{aiText}</p>
        ) : (
          <p className={`mt-2 text-sm ${muted}`}>
            Get plain-language ideas about median asks, spread, and sold vs active mix — powered by your visible pins
            {aiSource === "openai" ? "" : " (rules-based if AI is off)"}.
          </p>
        )}
        {aiError ? <p className="mt-2 text-sm text-red-400">{aiError}</p> : null}
        {aiSource ? (
          <p className={`mt-1 text-[10px] uppercase tracking-wide ${label}`}>Source: {aiSource}</p>
        ) : null}

        <label className={`mt-3 block text-xs font-medium ${label}`}>Ask a follow-up (optional)</label>
        <div className="mt-1 flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder='e.g. "Is this a buyer’s market here?"'
            className={
              dark
                ? "min-h-[40px] flex-1 rounded-lg border border-white/15 bg-black/50 px-3 py-2 text-sm text-white placeholder:text-slate-500"
                : "min-h-[40px] flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
            }
          />
          <button
            type="button"
            disabled={aiLoading || !question.trim()}
            onClick={() => {
              const q = question.trim();
              void loadAi(q);
            }}
            className={`min-h-[40px] shrink-0 rounded-lg px-4 text-sm font-semibold disabled:opacity-40 ${
              dark ? "border border-white/20 text-white hover:bg-white/10" : "border border-slate-300 text-slate-800 hover:bg-slate-50"
            }`}
          >
            Ask
          </button>
        </div>
      </div>

      <p className={`text-[11px] leading-snug ${label}`}>
        Pins use colour for status (sold, offer, rent vs sale). “Smart” price hints compare each ask to the median of
        <em> visible map pins only</em> — not a formal appraisal.
      </p>
    </div>
  );
}

function StatBox({ label, value, dark }: { label: string; value: string; dark: boolean }) {
  return (
    <div className={`rounded-lg px-2 py-1.5 ${dark ? "bg-white/5" : "bg-slate-100"}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-wide ${dark ? "text-slate-500" : "text-slate-500"}`}>
        {label}
      </p>
      <p className="text-sm font-bold tabular-nums">{value}</p>
    </div>
  );
}
