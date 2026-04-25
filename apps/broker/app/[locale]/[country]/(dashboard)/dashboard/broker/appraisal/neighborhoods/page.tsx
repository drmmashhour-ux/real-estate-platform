"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
  ZAxis,
} from "recharts";
import { getNeighborhoodZoneColor } from "@/lib/map/neighborhood-colors";

type HoodRow = {
  id: string;
  neighborhoodName: string;
  investmentZone: string | null;
  scoreOverall: number | null;
  scoreDemand: number | null;
  scoreValue: number | null;
  scoreYield: number | null;
  scoreRisk: number | null;
  aiSummary: string | null;
};

async function fetchNeighborhoodRows(): Promise<{ ok: boolean; rows: HoodRow[]; error?: string }> {
  const res = await fetch("/api/neighborhoods/list", {
    method: "POST",
    body: JSON.stringify({ city: "Laval", province: "QC" }),
    headers: { "Content-Type": "application/json" },
  });
  const json = (await res.json().catch(() => ({}))) as { rows?: HoodRow[]; error?: string };
  if (!res.ok) {
    return {
      ok: false,
      rows: [],
      error: json.error ?? `Could not load (${res.status}). Sign in as a broker/monitoring user.`,
    };
  }
  return { ok: true, rows: json.rows ?? [] };
}

export default function NeighborhoodsPage() {
  const [rows, setRows] = useState<HoodRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    const out = await fetchNeighborhoodRows();
    if (!out.ok) {
      setError(out.error ?? "Load failed");
      return;
    }
    setRows(out.rows);
  }

  useEffect(() => {
    let cancelled = false;
    void fetchNeighborhoodRows().then((out) => {
      if (cancelled) return;
      if (!out.ok) setError(out.error ?? "Load failed");
      else setRows(out.rows);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const top = useMemo(() => {
    const sorted = [...rows].filter((r) => r.scoreOverall != null).sort((a, b) => (b.scoreOverall ?? 0) - (a.scoreOverall ?? 0));
    return sorted[0] ?? null;
  }, [rows]);

  const radarData = top
    ? [
        { metric: "Demand", value: top.scoreDemand ?? 0 },
        { metric: "Value", value: top.scoreValue ?? 0 },
        { metric: "Yield", value: top.scoreYield ?? 0 },
        { metric: "Headroom", value: Math.max(0, 100 - (top.scoreRisk ?? 0)) },
        { metric: "Overall", value: top.scoreOverall ?? 0 },
      ]
    : [];

  const scatterData = rows.map((r) => ({
    x: r.scoreRisk ?? 0,
    y: r.scoreYield ?? 0,
    z: r.scoreOverall ?? 0,
    name: r.neighborhoodName,
    fill: getNeighborhoodZoneColor(r.investmentZone),
  }));

  return (
    <div className="p-6 space-y-6 text-white min-h-screen bg-zinc-950">
      <div>
        <h1 className="text-3xl font-bold text-[#D4AF37]">Neighborhood Intelligence</h1>
        <p className="text-white/60 max-w-2xl">
          Model-driven scores, investment zones, and yield vs risk views. Thin comparable data yields low confidence — never treat as
          certain.
        </p>
      </div>

      <button
        type="button"
        onClick={() => void refresh()}
        className="px-4 py-2 rounded-xl border border-white/15 text-white/90 text-sm"
      >
        Refresh list (Laval, QC)
      </button>

      {error ? <p className="text-amber-200/90 text-sm">{error}</p> : null}

      {top ? (
        <p className="text-white/50 text-sm">
          Radar shows top-ranked neighborhood: <span className="text-[#D4AF37]">{top.neighborhoodName}</span>
        </p>
      ) : null}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
          <div className="text-lg text-[#D4AF37] mb-3">Top Neighborhood Radar</div>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#333" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fill: "#71717a" }} />
                <Radar dataKey="value" stroke="#D4AF37" fill="#D4AF37" fillOpacity={0.35} name="Score" />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-white/45 text-sm">No scored neighborhoods yet. Run a rebuild from the API or load comparables.</p>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
          <div className="text-lg text-[#D4AF37] mb-3">Yield vs Risk</div>
          {scatterData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <ScatterChart margin={{ top: 16, right: 16, bottom: 16, left: 16 }}>
                <XAxis type="number" dataKey="x" name="Risk" tick={{ fill: "#a1a1aa" }} />
                <YAxis type="number" dataKey="y" name="Yield" tick={{ fill: "#a1a1aa" }} />
                <ZAxis type="number" dataKey="z" range={[40, 400]} />
                <Tooltip cursor={{ strokeDasharray: "3 3" }} formatter={(v: number, n: string) => [v, n]} />
                <Scatter name="Neighborhoods" data={scatterData} />
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-white/45 text-sm">No rows to plot.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {rows.map((row) => (
          <div
            key={row.id}
            className="rounded-2xl border border-white/10 bg-black/50 p-5"
            style={{ borderLeftWidth: 4, borderLeftColor: getNeighborhoodZoneColor(row.investmentZone) }}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="text-lg font-semibold text-[#D4AF37]">{row.neighborhoodName}</div>
              <div className="text-xs uppercase text-white/60">{row.investmentZone ?? "neutral"}</div>
            </div>

            <div className="mt-3 text-sm text-white/60">
              Overall: {row.scoreOverall ?? "—"} · Yield: {row.scoreYield ?? "—"} · Risk: {row.scoreRisk ?? "—"}
            </div>

            <div className="mt-3 text-sm text-white/70 whitespace-pre-wrap">
              {row.aiSummary ?? "No AI summary available yet."}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
