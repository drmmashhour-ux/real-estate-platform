"use client";

import React, { useState, useEffect } from "react";
import { FundOverview } from "@/components/fund/FundOverview";
import { FundAllocationTable } from "@/components/fund/FundAllocationTable";
import { InvestorBreakdown } from "@/components/fund/InvestorBreakdown";
import { ModeBanner } from "@/components/fund/ModeBanner";
import { ComplianceConsentBanner } from "@/components/compliance/ComplianceConsentBanner";
import { ComplianceDisclosureModal } from "@/components/compliance/ComplianceDisclosureModal";
import { AiTransparencySection } from "@/components/compliance/AiTransparencySection";
import { Loader2, Play, Coins, TrendingUp } from "lucide-react";

export function FundDashboardClient({ initialFunds, isAdmin }: { initialFunds: any[], isAdmin: boolean }) {
  const [selectedFundId, setSelectedFundId] = useState(initialFunds[0]?.id || null);
  const [fund, setFund] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isDisclosureOpen, setIsDisclosureOpen] = useState(false);

  useEffect(() => {
    if (selectedFundId) {
      fetchFundDetails(selectedFundId);
    }
  }, [selectedFundId]);

  useEffect(() => {
    // Check if user needs to accept fund disclosure
    setIsDisclosureOpen(true);
  }, []);

  async function fetchFundDetails(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/funds/${id}`);
      if (res.ok) {
        const data = await res.json();
        setFund(data.fund);
      }
    } catch (e) {
      console.error("Failed to fetch fund details", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAllocate() {
    if (!fund) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/funds/${fund.id}/allocate`, { method: "POST" });
      if (res.ok) {
        await fetchFundDetails(fund.id);
      } else {
        const data = await res.json();
        alert(data.error || "Allocation failed");
      }
    } catch (e) {
      console.error("Allocation failed", e);
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSimulateDistribution() {
    if (!fund) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/funds/${fund.id}/simulate-distribution`, { method: "POST" });
      if (res.ok) {
        alert("Distribution simulation complete!");
        await fetchFundDetails(fund.id);
      } else {
        const data = await res.json();
        alert(data.error || "Simulation failed");
      }
    } catch (e) {
      console.error("Distribution simulation failed", e);
    } finally {
      setActionLoading(false);
    }
  }

  if (initialFunds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Coins className="h-12 w-12 text-slate-700 mb-4" />
        <h2 className="text-xl font-bold text-white">No Autonomous Funds Found</h2>
        <p className="text-slate-500 max-w-sm mt-2">
          You haven't joined or created any AI-managed funds yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ComplianceDisclosureModal 
        context="FUND" 
        isOpen={isDisclosureOpen} 
        onAccepted={() => setIsDisclosureOpen(false)}
        onClose={() => setIsDisclosureOpen(false)}
      />

      <ComplianceConsentBanner 
        consentType="FINANCIAL_SIMULATION"
        title="Enable Financial Simulation Mode"
        description="To view detailed allocations and performance projections, you must grant consent for AI-driven financial simulation in accordance with Québec regulatory guidelines."
        onGranted={() => selectedFundId && fetchFundDetails(selectedFundId)}
      />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Autonomous Fund</h1>
          <p className="text-sm text-[#737373]">Autonomous capital allocation & performance tracking.</p>
        </div>
        <select 
          value={selectedFundId} 
          onChange={(e) => setSelectedFundId(e.target.value)}
          className="rounded-lg border border-white/10 bg-black/50 px-3 py-2 text-sm text-white focus:border-premium-gold outline-none"
        >
          {initialFunds.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-premium-gold" />
        </div>
      ) : fund ? (
        <>
          <ModeBanner mode={fund.mode} />
          
          <FundOverview fund={fund} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">Active Allocations</h2>
                  {isAdmin && (
                    <button 
                      onClick={handleAllocate}
                      disabled={actionLoading}
                      className="flex items-center gap-2 rounded-full bg-premium-gold px-4 py-1.5 text-xs font-bold text-black hover:bg-white transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3 fill-current" />}
                      Run Allocation
                    </button>
                  )}
                </div>
                <FundAllocationTable allocations={fund.allocations} />
              </section>

              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">Investor Participation</h2>
                </div>
                <InvestorBreakdown investors={fund.investors} />
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-xl border border-white/10 bg-black/40 p-5">
                <h2 className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-widest mb-4">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  Performance Snapshot
                </h2>
                {fund.performanceSnapshots[0] ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-end border-b border-white/5 pb-2">
                      <p className="text-[10px] text-[#737373] uppercase font-bold">Unrealized Growth</p>
                      <p className="text-lg font-mono font-bold text-emerald-500">+${Number(fund.performanceSnapshots[0].unrealizedPerformance).toLocaleString()}</p>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/5 pb-2">
                      <p className="text-[10px] text-[#737373] uppercase font-bold">Diversification</p>
                      <p className="text-lg font-mono font-bold text-white">{(fund.performanceSnapshots[0].diversificationScore * 100).toFixed(0)}%</p>
                    </div>
                    <div className="flex justify-between items-end border-b border-white/5 pb-2">
                      <p className="text-[10px] text-[#737373] uppercase font-bold">Risk Level</p>
                      <p className="text-lg font-mono font-bold text-amber-500">{(fund.performanceSnapshots[0].riskScore * 100).toFixed(0)}%</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-[#737373] py-4 text-center">No snapshots yet.</p>
                )}
                
                {isAdmin && (
                  <button 
                    onClick={handleSimulateDistribution}
                    disabled={actionLoading}
                    className="w-full mt-6 flex items-center justify-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-500 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
                  >
                    Simulate Distribution
                  </button>
                )}
              </section>

              <section>
                <h3 className="text-[10px] font-bold text-[#737373] uppercase tracking-widest mb-3">AI Reasoning & Compliance</h3>
                <AiTransparencySection 
                  reasoning="Allocating capital across diversified AMF deals to optimize for long-term growth while maintaining a 10% cash reserve for opportunistic entries."
                  confidence={0.88}
                  disclaimer="All fund activities are in simulation mode. Past performance of underlying deals is not indicative of future results."
                />
              </section>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
