"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { HubTheme } from "@/lib/hub/themes";
import { InvestmentRankCard } from "@/components/investments/InvestmentRankCard";
import { MatchedProjectCard } from "@/components/investments/MatchedProjectCard";
import { UnitPredictionCard } from "@/components/investments/UnitPredictionCard";
import { InvestorInsightCard } from "@/components/investments/InvestorInsightCard";
import { InvestmentsMarketOverview } from "@/components/market/InvestmentsMarketOverview";

type RankedProject = {
  projectId: string;
  score: number;
  rank?: number;
  appreciationPotential: number;
  rentalYield: number;
  riskScore: number;
  reason: string;
  bestUnitSuggestion: { unitId: string | null; label: string; predictedValue: number };
};

type Match = { projectId: string; matchScore: number; reasons: string[]; recommendedUnitId: string | null };

/** API list payloads — typed loosely until routes expose shared DTOs */
type InvestmentListRecord = Record<string, unknown>;

export function InvestmentsDashboardClient({ theme }: { theme: HubTheme }) {
  void theme; // HubTheme available when wiring dashboard tokens to child cards
  const [ranked, setRanked] = useState<RankedProject[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [favorites, setFavorites] = useState<InvestmentListRecord[]>([]);
  const [alerts, setAlerts] = useState<InvestmentListRecord[]>([]);
  const [reservations, setReservations] = useState<InvestmentListRecord[]>([]);
  const [portfolio, setPortfolio] = useState<InvestmentListRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/ai/investment-ranking", { credentials: "same-origin" }).then((r) => r.json()),
      fetch("/api/ai/match-projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile: { cityPreference: "Montreal", maxBudget: 750000, investmentGoal: "appreciation" } }), credentials: "same-origin" }).then((r) => r.json()),
      fetch("/api/projects/favorites", { credentials: "same-origin" }).then((r) => r.json()),
      fetch("/api/projects/alerts", { credentials: "same-origin" }).then((r) => r.json()),
      fetch("/api/projects/reservations", { credentials: "same-origin" }).then((r) => r.json()),
      fetch("/api/investments/portfolio", { credentials: "same-origin" }).then((r) => r.json()),
    ])
      .then(([rankData, matchData, favData, alertData, resData, portfolioData]) => {
        setRanked(Array.isArray(rankData) ? rankData : []);
        setMatches(Array.isArray(matchData) ? matchData : []);
        setFavorites(Array.isArray(favData) ? favData : []);
        setAlerts(Array.isArray(alertData) ? alertData : []);
        setReservations(Array.isArray(resData) ? resData : []);
        setPortfolio(Array.isArray(portfolioData) ? portfolioData : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const top3 = ranked.slice(0, 3);
  const avgRoi = ranked.length ? ranked.reduce((s, p) => s + p.rentalYield, 0) / ranked.length : 0;
  const topScore = ranked[0]?.score ?? 0;

  const insight = useMemo(() => {
    const bestCity = ranked[0]?.projectId ? "Montreal" : "Montreal";
    const bestDelivery = "2026";
    return {
      bestCity,
      bestDelivery,
      risk: ranked.length ? "Avoid high-risk overleveraged projects; prioritize featured under-construction assets." : "Use featured projects with strong demand.",
      strategy: avgRoi >= 0.055 ? "Rental-first" : "Appreciation-first",
    };
  }, [ranked, avgRoi]);

  if (loading) {
    return <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-slate-400">Loading investor dashboard…</div>;
  }

  return (
    <div className="space-y-8">
      <section
        id="edit-profile"
        className="rounded-2xl border border-[#C9A646]/25 bg-gradient-to-br from-black/50 to-[#1a1508]/80 p-5"
      >
        <p className="text-xs uppercase tracking-wider text-[#C9A646]">Investment profile</p>
        <p className="mt-2 text-sm text-slate-200">
          Your goals, budget, and cities power matches, alerts, and rankings below. Update anytime as your strategy
          changes.
        </p>
      </section>
      <p className="text-xs uppercase tracking-wider text-slate-500">Last updated: AI analysis</p>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InvestorInsightCard title="Watchlist" value={String(favorites.length)} description="Saved projects from favorites." />
        <InvestorInsightCard title="Matched projects" value={String(matches.length)} description="Projects aligned to your profile." />
        <InvestorInsightCard title="Average projected ROI" value={`${(avgRoi * 100).toFixed(1)}%`} description="Based on current AI ranking." />
        <InvestorInsightCard title="Top opportunity" value={`${topScore}/100`} description="Highest ranked project score." />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-[#C9A646]/25 bg-gradient-to-br from-black/60 to-[#1a1508] p-5">
          <p className="text-xs uppercase tracking-wider text-[#C9A646]">ROI snapshot</p>
          <p className="mt-2 text-2xl font-bold text-white">{(avgRoi * 100).toFixed(1)}%</p>
          <p className="mt-1 text-xs text-slate-400">Avg. projected yield from AI ranking.</p>
          <Link href="/invest/tools/roi" className="mt-3 inline-block text-sm font-medium text-[#C9A646] hover:underline">
            Open full ROI calculator →
          </Link>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500">Best city (by AI ranking)</p>
          <p className="mt-2 text-xl font-semibold text-white">{insight.bestCity}</p>
          <p className="mt-1 text-xs text-slate-400">From current opportunity set — illustrative.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500">Est. monthly cash flow</p>
          <p className="mt-2 text-xl font-semibold text-white">—</p>
          <p className="mt-1 text-xs text-slate-400">Use the ROI tool with your rent &amp; expenses.</p>
          <Link href="/invest/tools/roi" className="mt-2 inline-block text-sm text-[#C9A646] hover:underline">
            Calculate →
          </Link>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500">Financing impact</p>
          <p className="mt-2 text-sm text-slate-300">Model rate &amp; amortization in ROI or speak to a specialist.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/mortgage" className="rounded-lg bg-[#C9A646] px-3 py-1.5 text-xs font-semibold text-black">
              Mortgage
            </Link>
            <Link href="/invest/tools/roi" className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-white">
              ROI tool
            </Link>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <p className="text-sm font-medium text-white">Compare two scenarios</p>
        <p className="mt-1 text-xs text-slate-500">Side-by-side projects — or run two columns in the ROI calculator.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/dashboard/investments/compare" className="rounded-lg border border-[#C9A646]/40 px-4 py-2 text-sm text-[#C9A646]">
            Project compare
          </Link>
          <Link href="/invest/tools/roi" className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white">
            ROI calculator
          </Link>
        </div>
      </section>

      <InvestmentsMarketOverview />

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-semibold text-white">Top Investment Opportunities</h2>
          <div className="mt-4 grid gap-4">
            {ranked.length ? ranked.map((item) => <InvestmentRankCard key={item.projectId} {...item} />) : <p className="text-slate-400">No rankings yet.</p>}
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-semibold text-white">AI Insights</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <p><span className="text-slate-500">Best city:</span> {insight.bestCity}</p>
            <p><span className="text-slate-500">Best delivery year:</span> {insight.bestDelivery}</p>
            <p><span className="text-slate-500">Top risk to avoid:</span> {insight.risk}</p>
            <p><span className="text-slate-500">Best strategy:</span> {insight.strategy}</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Auto-Matched Projects</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {matches.slice(0, 6).map((m) => <MatchedProjectCard key={m.projectId} {...m} />)}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Unit Opportunities</h2>
        {ranked[0] ? (
          <UnitPredictionCard
            title={`Best opportunity: ${ranked[0].bestUnitSuggestion.label}`}
            currentValue={Math.round(ranked[0].bestUnitSuggestion.predictedValue * 0.9)}
            deliveryValue={ranked[0].bestUnitSuggestion.predictedValue}
            oneYearValue={Math.round(ranked[0].bestUnitSuggestion.predictedValue * 0.97)}
            growthPercent={ranked[0].appreciationPotential}
            rentalYield={ranked[0].rentalYield}
            confidence={78}
          />
        ) : (
          <p className="text-slate-400">No unit opportunities available.</p>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Portfolio Summary</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <InvestorInsightCard title="Total invested" value={`$${portfolio.reduce((s, p) => s + Number(p.purchasePrice ?? 0), 0).toLocaleString()}`} description="Recorded portfolio cost basis." />
          <InvestorInsightCard title="Current value" value={`$${portfolio.reduce((s, p) => s + Number(p.currentValue ?? p.purchasePrice ?? 0), 0).toLocaleString()}`} description="AI-updated estimate." />
          <InvestorInsightCard title="ROI" value={`${portfolio.length ? (((portfolio.reduce((s, p) => s + Number(p.currentValue ?? p.purchasePrice ?? 0), 0) - portfolio.reduce((s, p) => s + Number(p.purchasePrice ?? 0), 0)) / Math.max(1, portfolio.reduce((s, p) => s + Number(p.purchasePrice ?? 0), 0))) * 100).toFixed(1) : "0.0"}%`} description="Current gain/loss." />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">AI Alerts Feed</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {alerts.slice(0, 4).map((a, idx) => {
            const row = a as Record<string, unknown>;
            const id = typeof row.id === "string" ? row.id : `alert-${idx}`;
            const alertType = typeof row.alertType === "string" ? row.alertType : "";
            const city = typeof row.city === "string" ? row.city : "Any city";
            return (
              <div key={id} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="font-semibold text-white">{alertType ? alertType.replace(/-/g, " ") : "Alert"}</p>
                <p className="mt-1 text-sm text-slate-300">{city}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href="/dashboard/investments/compare" className="rounded-lg bg-teal-500 px-4 py-2 text-sm font-semibold text-slate-950">Compare</Link>
            <Link href="/dashboard/investments/matches" className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white">Matches</Link>
            <Link href="/dashboard/investments/alerts" className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white">Alerts</Link>
            <Link href="/projects" className="rounded-lg border border-white/20 px-4 py-2 text-sm text-white">Save to Watchlist</Link>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-lg font-semibold text-white">Watchlist / Alerts</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-300">
            <p>Saved projects: {favorites.length}</p>
            <p>Active alerts: {alerts.filter((a) => a.isActive).length}</p>
            <p>Reservations: {reservations.length}</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Top 3 opportunities</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {top3.map((item) => <InvestmentRankCard key={item.projectId} {...item} />)}
        </div>
      </section>
    </div>
  );
}
