"use client";

import { useEffect, useState } from "react";
import { RolloutStatusTable } from "@/components/evolution/rollouts/RolloutStatusTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Rocket, RefreshCw, ShieldAlert, CheckCircle2, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function RolloutDashboardClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/evolution/rollouts");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to load rollout data", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  if (loading && !data) {
    return (
      <div className="p-6 space-y-6 animate-pulse bg-black min-h-screen">
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

  if (!data) return <div className="p-8 text-white bg-black min-h-screen">Error loading dashboard.</div>;

  const activeCount = data.rollouts.filter((r: any) => r.status === "ACTIVE").length;
  const completedCount = data.rollouts.filter((r: any) => r.status === "COMPLETED").length;
  const rolledBackCount = data.rollouts.filter((r: any) => r.status === "ROLLED_BACK").length;

  return (
    <div className="p-6 space-y-8 min-h-screen bg-black text-zinc-100 pb-24">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <Rocket className="w-8 h-8 text-blue-500 fill-blue-500/10" />
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
              Policy Rollouts
            </h1>
          </div>
          <p className="text-zinc-500 font-medium tracking-tight uppercase text-xs">
            Progressive Deployment & Multi-Domain Safety Guard
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
          Sync Rollouts
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4 bg-zinc-900 border-zinc-800 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Rollouts</p>
              <p className="text-2xl font-black text-white">{activeCount}</p>
            </div>
            <Activity className="w-6 h-6 text-blue-500/50" />
          </div>
        </Card>

        <Card className="p-4 bg-zinc-900 border-zinc-800 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Fully Deployed</p>
              <p className="text-2xl font-black text-white">{completedCount}</p>
            </div>
            <CheckCircle2 className="w-6 h-6 text-green-500/50" />
          </div>
        </Card>

        <Card className="p-4 bg-zinc-900 border-zinc-800 border-l-4 border-l-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Rolled Back</p>
              <p className="text-2xl font-black text-white">{rolledBackCount}</p>
            </div>
            <History className="w-6 h-6 text-red-500/50" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <RolloutStatusTable rollouts={data.rollouts} onAction={loadData} />
        </div>

        <div className="space-y-6">
          <Card className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
            <h3 className="text-xs font-bold text-zinc-400 mb-4 uppercase tracking-tighter flex items-center">
              <ShieldAlert className="w-4 h-4 text-orange-500 mr-2" />
              Safety Protocols
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black text-zinc-600 uppercase">Deterministic Assignment</p>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  Traffic is split using consistent hashing on <code>userId</code>. A user in the 5% bucket will remain in the rollout as it expands.
                </p>
              </div>
              <div className="pt-2 border-t border-zinc-800">
                <p className="text-[10px] font-black text-zinc-600 uppercase">Step Advancement</p>
                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  Automatic advancement occurs every 24h of confirmed metric stability. Rollback triggers instantly on &gt;1% conversion drop.
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-blue-900/20 to-black border border-blue-500/10 rounded-xl">
            <h4 className="text-blue-400 font-bold text-sm mb-2 italic">Pro Tip</h4>
            <p className="text-zinc-500 text-[11px] leading-relaxed italic">
              "Never roll out on a Friday. Even the smartest self-healing system shouldn't be tested when humans want to sleep."
            </p>
          </Card>
        </div>
      </div>

      <div className="pt-12 border-t border-zinc-900 opacity-20 italic">
        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest text-center">
          Evolution Rollout Engine v1.0.0 — Continuous Deployment Safety Layer
        </p>
      </div>
    </div>
  );
}
