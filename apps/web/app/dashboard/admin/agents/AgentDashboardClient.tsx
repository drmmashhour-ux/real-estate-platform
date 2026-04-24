"use client";

import { useEffect, useState } from "react";
import { AgentRankingsTable } from "@/components/agents/AgentRankingsTable";
import { CompetitionSummaryPanel } from "@/components/agents/CompetitionSummaryPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, RefreshCw, AlertTriangle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AgentDashboardClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/agents/overview");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to load agent data", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !data) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <Skeleton className="h-12 w-64 bg-zinc-800" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24 bg-zinc-800" />
          <Skeleton className="h-24 bg-zinc-800" />
          <Skeleton className="h-24 bg-zinc-800" />
        </div>
        <Skeleton className="h-[400px] bg-zinc-800" />
      </div>
    );
  }

  if (!data) return <div className="p-8 text-white">Error loading dashboard.</div>;

  return (
    <div className="p-6 space-y-8 min-h-screen bg-black text-zinc-100 pb-24">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <Crown className="w-8 h-8 text-yellow-500 fill-yellow-500/10" />
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
              Agent Coordination
            </h1>
          </div>
          <p className="text-zinc-500 font-medium tracking-tight uppercase text-xs">
            Multi-Domain Competitive Learning & Safety Layer
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadData}
          disabled={loading}
          className="bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh Stats
        </Button>
      </div>

      <CompetitionSummaryPanel agents={data.agents} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <AgentRankingsTable agents={data.agents} onStatusChange={loadData} />
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-tighter flex items-center">
              <ShieldCheck className="w-4 h-4 text-green-500 mr-2" />
              Safety Enforcement
            </h3>
            <ul className="space-y-3">
              {[
                "Policy weight caps enforced: ±0.05 max",
                "Direct production mutation: DISABLED",
                "Human override: ALWAYS AVAILABLE",
                "Conflict resolution: COMPETITION_WINNER"
              ].map((rule, idx) => (
                <li key={idx} className="text-xs text-zinc-400 flex items-start">
                  <div className="w-1 h-1 rounded-full bg-zinc-700 mt-1.5 mr-2 shrink-0" />
                  {rule}
                </li>
              ))}
            </ul>
          </div>

          <div className="p-4 bg-zinc-900/50 border border-dashed border-zinc-800 rounded-xl opacity-60">
            <h3 className="text-xs font-bold text-zinc-500 mb-3 uppercase tracking-widest">Upcoming Duels</h3>
            <div className="space-y-2">
              <div className="p-2 bg-zinc-950 rounded flex justify-between items-center">
                <span className="text-[10px] font-bold text-zinc-400">Pricing Engine V4 vs V5</span>
                <span className="text-[9px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">T+2h</span>
              </div>
              <div className="p-2 bg-zinc-950 rounded flex justify-between items-center">
                <span className="text-[10px] font-bold text-zinc-400">Ranking Optimizer Alpha vs Beta</span>
                <span className="text-[9px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded">T+6h</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Audit */}
      <div className="pt-12 border-t border-zinc-900 flex justify-between items-center opacity-30 italic">
        <p className="text-[10px] text-zinc-500">
          SYSTEM AUDIT: All agent proposals are logged to [agents] event stream and require human rollout approval unless in SANDBOX mode.
        </p>
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
          Multi-Agent OS v1.0.0
        </p>
      </div>
    </div>
  );
}
