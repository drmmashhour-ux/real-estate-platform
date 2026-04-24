"use client";

import React, { useState, useEffect } from "react";
import { CapitalAllocationPlan, AllocationStrategyMode } from "@/modules/capital-ai/capital-allocator.types";
import { CapitalAllocationOverview } from "@/components/capital/CapitalAllocationOverview";
import { CapitalAllocationTable } from "@/components/capital/CapitalAllocationTable";
import { CapitalStrategySelector } from "@/components/capital/CapitalStrategySelector";
import { Loader2, RefreshCw, AlertTriangle, ShieldCheck } from "lucide-react";

export function CapitalDashboardClient() {
  const [strategy, setStrategy] = useState<AllocationStrategyMode>("BALANCED");
  const [totalCapital, setTotalCapital] = useState(10000000);
  const [plan, setPlan] = useState<CapitalAllocationPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAllocation();
  }, [strategy, totalCapital]);

  async function fetchAllocation() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/capital/allocate?strategyMode=${strategy}&totalCapital=${totalCapital}`);
      const data = await res.json();
      if (data.ok) {
        setPlan(data.plan);
      } else {
        setError(data.error);
      }
    } catch (e) {
      setError("Failed to fetch capital allocation recommendation.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Capital Allocation Command Center</h1>
          <p className="text-sm text-[#737373]">Autonomous risk-adjusted capital deployment recommendations.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-[#737373] uppercase tracking-widest mb-1">Target Capital (USD)</span>
            <input 
              type="number" 
              value={totalCapital}
              onChange={(e) => setTotalCapital(Number(e.target.value))}
              className="w-32 bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-sm font-mono text-white focus:border-premium-gold outline-none"
            />
          </div>
          <button 
            onClick={fetchAllocation}
            disabled={loading}
            className="p-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors disabled:opacity-50 mt-4"
          >
            <RefreshCw className={loading ? "w-4 h-4 animate-spin" : "w-4 h-4"} />
          </button>
        </div>
      </div>

      <section>
        <h2 className="text-xs font-bold text-[#737373] uppercase tracking-widest mb-4">Allocation Strategy</h2>
        <CapitalStrategySelector selected={strategy} onChange={setStrategy} />
      </section>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 flex items-center gap-3 text-rose-500">
          <AlertTriangle className="w-5 h-5" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {loading && !plan ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#737373]">
          <Loader2 className="w-10 h-10 animate-spin mb-4" />
          <p className="text-sm">Synthesizing market data and running allocation models...</p>
        </div>
      ) : plan ? (
        <div className={loading ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
          <section className="space-y-6">
            <CapitalAllocationOverview plan={plan} />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xs font-bold text-[#737373] uppercase tracking-widest">Recommended Allocations</h2>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
                    <ShieldCheck className="w-3 h-3" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Explainable Recommendation</span>
                  </div>
                </div>
                <CapitalAllocationTable allocations={plan.allocations} />
              </div>
              
              <div className="space-y-6">
                <section className="rounded-xl border border-white/10 bg-black/40 p-5">
                  <h3 className="text-[10px] font-bold text-[#737373] uppercase tracking-widest mb-3 text-premium-gold">AI Synthesis</h3>
                  <p className="text-sm text-white leading-relaxed mb-4">
                    {plan.summary}
                  </p>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                      <span className="text-[10px] font-bold text-[#737373] uppercase block mb-1">Exposure Strategy</span>
                      <p className="text-xs text-[#B3B3B3]">
                        {strategy === "CONSERVATIVE" ? "Focus on high-confidence compliance and low-risk signals." : 
                         strategy === "AGGRESSIVE" ? "Seeking alpha through high-growth regions and financing leverage." :
                         strategy === "ESG_FOCUSED" ? "Filtering for top-decile ESG impact scores across all regions." :
                         "Balanced optimization between risk metrics and expected yields."}
                      </p>
                    </div>
                  </div>
                </section>

                <section className="rounded-xl border border-white/10 bg-black/40 p-5">
                  <h3 className="text-[10px] font-bold text-[#737373] uppercase tracking-widest mb-3">Safety & Governance</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-[10px] text-[#737373]">
                      <div className="w-1 h-1 rounded-full bg-emerald-500" />
                      Max concentration cap enforced (30%)
                    </li>
                    <li className="flex items-center gap-2 text-[10px] text-[#737373]">
                      <div className="w-1 h-1 rounded-full bg-emerald-500" />
                      Regional exposure limits active (50%)
                    </li>
                    <li className="flex items-center gap-2 text-[10px] text-[#737373]">
                      <div className="w-1 h-1 rounded-full bg-emerald-500" />
                      AVOID/REJECTED deals filtered
                    </li>
                    <li className="flex items-center gap-2 text-[10px] text-[#737373]">
                      <div className="w-1 h-1 rounded-full bg-emerald-500" />
                      Data-thin deals penalized
                    </li>
                  </ul>
                </section>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
