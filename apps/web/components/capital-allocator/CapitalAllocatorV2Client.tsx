"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import type { PortfolioInsights } from "@/modules/capital-allocator/capital-portfolio-insight.service";
import type { CapitalRecommendation } from "@/modules/capital-allocator/capital-recommendation.service";
import type { ScenarioResult } from "@/modules/capital-allocator/capital-scenario.service";
import { TrendingUp, AlertTriangle, Lightbulb, Play, Loader2 } from "lucide-react";

type Props = {
  locale: string;
  country: string;
};

export function CapitalAllocatorV2Client({ locale, country }: Props) {
  const [insights, setInsights] = useState<PortfolioInsights | null>(null);
  const [recommendations, setRecommendations] = useState<CapitalRecommendation[]>([]);
  const [simulation, setSimulation] = useState<ScenarioResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [simLoading, setSimLoading] = useState(false);
  const [additionalBudget, setAdditionalBudget] = useState(10000);
  const [strategy, setStrategy] = useState<"aggressive" | "conservative" | "balanced">("balanced");

  useEffect(() => {
    async function fetchData() {
      try {
        const [insRes, recRes] = await Promise.all([
          fetch("/api/capital-allocator/insights"),
          fetch("/api/capital-allocator/recommendations"),
        ]);
        if (insRes.ok) {
          const insData = await insRes.json();
          setInsights(insData.insights);
        }
        if (recRes.ok) {
          const recData = await recRes.json();
          setRecommendations(recData.recommendations);
        }
      } catch (err) {
        console.error("Failed to fetch V2 data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleSimulate = async () => {
    setSimLoading(true);
    try {
      const res = await fetch("/api/capital-allocator/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ additionalBudget, reallocationStrategy: strategy }),
      });
      if (res.ok) {
        const data = await res.json();
        setSimulation(data.simulation);
      }
    } catch (err) {
      console.error("Simulation failed", err);
    } finally {
      setSimLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-premium-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Portfolio Insights */}
      {insights && (
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Top Contributors
            </h2>
            <div className="mt-4 space-y-3">
              {insights.topPerformers.map((p) => (
                <div key={p.listingId} className="flex justify-between text-sm text-[#B3B3B3]">
                  <span>{p.listingTitle}</span>
                  <span className="font-mono text-white">${p.metrics.grossRevenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
              Risk Alerts
            </h2>
            <div className="mt-4 space-y-3">
              {insights.riskAlerts.length === 0 ? (
                <p className="text-xs text-[#737373]">No critical risks detected.</p>
              ) : (
                insights.riskAlerts.map((a, idx) => (
                  <div key={idx} className="rounded-lg bg-rose-500/10 p-2 text-xs text-rose-200 border border-rose-500/20">
                    <strong>{a.listingTitle}</strong>: {a.reason}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {/* AI Recommendations */}
      <section className="rounded-2xl border border-white/10 bg-black/35 p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white">
          <Lightbulb className="h-4 w-4 text-premium-gold" />
          Actionable Recommendations
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
          {recommendations.length === 0 ? (
            <p className="col-span-3 text-sm text-[#737373]">Analyzing portfolio for recommendations...</p>
          ) : (
            recommendations.map((r, idx) => (
              <div key={idx} className="rounded-xl border border-white/10 bg-black/40 p-4">
                <div className="text-xs font-bold text-premium-gold uppercase tracking-wider">{r.recommendation}</div>
                <p className="mt-2 text-xs text-[#B3B3B3] leading-relaxed">{r.reason}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-[10px] text-[#737373]">Confidence</span>
                  <span className="text-[10px] font-mono text-white">{Math.round(r.confidenceScore * 100)}%</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Scenario Simulator */}
      <section className="rounded-2xl border border-premium-gold/20 bg-premium-gold/5 p-6">
        <h2 className="flex items-center gap-2 text-lg font-bold text-white">
          <Play className="h-5 w-5 text-premium-gold fill-premium-gold" />
          Scenario Simulator
        </h2>
        <p className="mt-1 text-xs text-[#B3B3B3]">Simulate budget shifts and strategy changes across your portfolio.</p>
        
        <div className="mt-6 flex flex-wrap items-end gap-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-[#737373]">Additional Budget (CAD)</label>
            <input
              type="number"
              value={additionalBudget}
              onChange={(e) => setAdditionalBudget(Number(e.target.value))}
              className="block w-40 rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-premium-gold outline-none"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-[#737373]">Strategy</label>
            <select
              value={strategy}
              onChange={(e) => setStrategy(e.target.value as any)}
              className="block w-40 rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-premium-gold outline-none"
            >
              <option value="balanced">Balanced</option>
              <option value="aggressive">Aggressive</option>
              <option value="conservative">Conservative</option>
            </select>
          </div>

          <button
            onClick={handleSimulate}
            disabled={simLoading}
            className="flex items-center gap-2 rounded-full bg-premium-gold px-6 py-2 text-sm font-bold text-black hover:bg-white transition-colors disabled:opacity-50"
          >
            {simLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simulate Impact"}
          </button>
        </div>

        {simulation && (
          <div className="mt-8 animate-in fade-in slide-in-from-top-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                <div className="text-[10px] uppercase text-[#737373]">Projected Revenue Impact</div>
                <div className="mt-1 text-2xl font-bold text-emerald-500">+${simulation.projectedImpact.toLocaleString()}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40 p-4">
                <div className="text-[10px] uppercase text-[#737373]">Projected Risk Change</div>
                <div className="mt-1 text-2xl font-bold text-amber-500">{simulation.projectedRiskChange > 0 ? "+" : ""}{(simulation.projectedRiskChange * 100).toFixed(1)}%</div>
              </div>
            </div>
            
            <div className="mt-6 overflow-hidden rounded-xl border border-white/10">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-[#737373]">
                  <tr>
                    <th className="px-4 py-3 font-bold uppercase">Listing</th>
                    <th className="px-4 py-3 font-bold uppercase">Original</th>
                    <th className="px-4 py-3 font-bold uppercase text-premium-gold">Simulated</th>
                    <th className="px-4 py-3 font-bold uppercase">Shift</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {simulation.bestAllocationStrategy.items.slice(0, 5).map((item) => {
                    const original = insights?.topPerformers.find(i => i.listingId === item.listingId)?.allocatedAmount ?? 0;
                    const diff = item.allocatedAmount - original;
                    return (
                      <tr key={item.listingId} className="bg-black/20">
                        <td className="px-4 py-3 font-medium text-white">{item.listingTitle}</td>
                        <td className="px-4 py-3 text-[#B3B3B3] font-mono">${original.toLocaleString()}</td>
                        <td className="px-4 py-3 text-premium-gold font-mono font-bold">${item.allocatedAmount.toLocaleString()}</td>
                        <td className={`px-4 py-3 font-mono ${diff > 0 ? "text-emerald-500" : "text-[#737373]"}`}>
                          {diff > 0 ? "+" : ""}${diff.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
