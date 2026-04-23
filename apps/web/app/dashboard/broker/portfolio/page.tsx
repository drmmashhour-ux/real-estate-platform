"use client";

import { useCallback, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import type { ComputedPortfolio } from "@/lib/investor/computed-portfolio.types";

const CHART_COLORS = ["#D4AF37", "#C0A062", "#8B7355", "#5C4A2A", "#3D3220", "#2A2215"];

function money(n: number) {
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function pct(n: number) {
  return `${(n * 100).toFixed(2)}%`;
}

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState<ComputedPortfolio | null>(null);
  const [portfolioId, setPortfolioId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (id: string) => {
    setError(null);
    const res = await fetch("/api/investor/portfolio/compute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ portfolioId: id }),
    });
    const data = (await res.json().catch(() => ({}))) as { portfolio?: ComputedPortfolio; error?: string };
    if (!res.ok) {
      setError(data.error ?? `Request failed (${res.status})`);
      return;
    }
    setPortfolio(data.portfolio ?? null);
  }, []);

  async function createDemo() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/investor/portfolio/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Broker demo portfolio",
          properties: [
            {
              address: "1000 rue Demo, Laval",
              city: "Laval",
              capRate: 0.055,
              roiPercent: 0.08,
              monthlyCashflowCents: 45_000,
              dscr: 1.28,
              neighborhoodScore: 72,
              currentValueCents: 450_000_00,
            },
            {
              address: "200 avenue Sample, Montréal",
              city: "Montréal",
              capRate: 0.048,
              roiPercent: 0.065,
              monthlyCashflowCents: 28_000,
              dscr: 1.15,
              neighborhoodScore: 68,
              currentValueCents: 380_000_00,
            },
            {
              address: "300 chemin Test, Longueuil",
              city: "Longueuil",
              capRate: 0.062,
              roiPercent: 0.09,
              monthlyCashflowCents: 52_000,
              dscr: 1.35,
              neighborhoodScore: 70,
              currentValueCents: 510_000_00,
            },
          ],
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { portfolio?: { id: string }; error?: string };
      if (!res.ok) {
        setError(data.error ?? `Create failed (${res.status})`);
        return;
      }
      const id = data.portfolio?.id;
      if (!id) {
        setError("No portfolio id returned");
        return;
      }
      setPortfolioId(id);
      await load(id);
    } finally {
      setBusy(false);
    }
  }

  const pieData =
    portfolio?.properties
      .filter((p) => (p.currentValueCents ?? 0) > 0)
      .map((p) => ({
        name: p.address.slice(0, 28) + (p.address.length > 28 ? "…" : ""),
        value: (p.currentValueCents ?? 0) / 100,
      })) ?? [];

  const barData =
    portfolio?.properties.map((p) => ({
      name: p.address.slice(0, 16) + (p.address.length > 16 ? "…" : ""),
      rankingScore: p.rankingScore ?? 0,
    })) ?? [];

  return (
    <div className="p-6 space-y-6 text-white min-h-screen bg-zinc-950">
      <div>
        <h1 className="text-3xl font-semibold text-[#D4AF37]">Portfolio Dashboard</h1>
        <p className="text-white/55 text-sm mt-1 max-w-2xl">
          Rank holdings by cap rate, ROI, cashflow, DSCR, location, and debt-service risk. Advisory model only — not investment advice.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void createDemo()}
          disabled={busy}
          className="px-4 py-2 rounded-xl bg-[#D4AF37] text-black font-semibold disabled:opacity-50"
        >
          {busy ? "Working…" : "Create demo portfolio + compute"}
        </button>
        {portfolioId ? (
          <button
            type="button"
            onClick={() => void load(portfolioId)}
            className="px-4 py-2 rounded-xl border border-white/15 text-white/90"
          >
            Recompute rankings
          </button>
        ) : null}
      </div>

      {error ? <p className="text-amber-200/90 text-sm">{error}</p> : null}

      {portfolio && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card title="Total value" value={money(portfolio.totalValueCents / 100)} />
            <Card title="Monthly cashflow" value={money(portfolio.totalCashflowCents / 100)} />
            <Card title="Avg cap rate" value={pct(portfolio.avgCapRate)} />
            <Card title="Avg ROI" value={pct(portfolio.avgROI)} />
          </div>

          {pieData.length > 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
              <div className="text-[#D4AF37] text-sm font-medium mb-2">Allocation by value</div>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {pieData.map((_, i) => (
                      <Cell key={`cell-${i}`} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => money(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : null}

          {barData.length > 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/50 p-4">
              <div className="text-[#D4AF37] text-sm font-medium mb-2">Ranking scores</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <XAxis dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fill: "#a1a1aa" }} domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="rankingScore" fill="#D4AF37" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : null}

          <div className="space-y-2">
            <div className="text-[#D4AF37] text-sm font-medium">Properties</div>
            {portfolio.properties.map((p) => (
              <div key={p.id} className="border border-white/10 rounded-xl p-4 bg-black/40">
                <strong className="text-white/90">{p.address}</strong>
                <span className="text-white/50"> — {p.rankingLabel ?? "—"}</span>
                <div className="text-xs text-white/45 mt-1">
                  Score {p.rankingScore != null ? Math.round(p.rankingScore) : "—"} · Risk {p.riskLevel ?? "—"} · DSCR{" "}
                  {p.dscr != null ? p.dscr.toFixed(2) : "—"}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-black/50 border border-white/10 rounded-xl p-4">
      <p className="text-white/50 text-sm">{title}</p>
      <h2 className="text-xl font-semibold text-[#D4AF37] mt-1">{value}</h2>
    </div>
  );
}
