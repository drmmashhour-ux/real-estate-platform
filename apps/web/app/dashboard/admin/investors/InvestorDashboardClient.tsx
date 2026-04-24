"use client";

import { useEffect, useState } from "react";
import { InvestorKanban } from "@/components/investor-fundraising/InvestorKanban";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  Target, 
  TrendingUp, 
  RefreshCw, 
  Plus,
  ArrowUpRight,
  PieChart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function InvestorDashboardClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/investors");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to load investor data", err);
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
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24 bg-zinc-800" />)}
        </div>
        <Skeleton className="h-[500px] bg-zinc-800" />
      </div>
    );
  }

  const investors = data?.investors || [];
  const totalTarget = investors.reduce((acc: number, i: any) => acc + (i.targetAmount || 0), 0);
  const totalActual = investors.reduce((acc: number, i: any) => acc + (i.actualAmount || 0), 0);
  const closedCount = investors.filter((i: any) => i.stage === "CLOSED").length;
  const convRate = investors.length > 0 ? (closedCount / investors.length) * 100 : 0;

  return (
    <div className="p-6 space-y-8 min-h-screen bg-black text-zinc-100 pb-24">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <TrendingUp className="w-8 h-8 text-green-500 fill-green-500/10" />
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
              Fundraising Pipeline
            </h1>
          </div>
          <p className="text-zinc-500 font-medium tracking-tight uppercase text-xs">
            Investor Relationship Management & Capital Tracking
          </p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadData}
            disabled={loading}
            className="bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Sync
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white font-bold">
            <Plus className="w-4 h-4 mr-2" />
            New Investor
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-4 bg-zinc-900 border-zinc-800 border-l-4 border-l-zinc-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Total Pipeline</p>
              <p className="text-2xl font-black text-white">{investors.length}</p>
            </div>
            <Users className="w-6 h-6 text-zinc-500/50" />
          </div>
        </Card>

        <Card className="p-4 bg-zinc-900 border-zinc-800 border-l-4 border-l-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Target Capital</p>
              <p className="text-2xl font-black text-white">${(totalTarget / 100 / 1000000).toFixed(1)}M</p>
            </div>
            <Target className="w-6 h-6 text-blue-500/50" />
          </div>
        </Card>

        <Card className="p-4 bg-zinc-900 border-zinc-800 border-l-4 border-l-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Capital Raised</p>
              <p className="text-2xl font-black text-white">${(totalActual / 100 / 1000).toFixed(0)}K</p>
            </div>
            <ArrowUpRight className="w-6 h-6 text-green-500/50" />
          </div>
        </Card>

        <Card className="p-4 bg-zinc-900 border-zinc-800 border-l-4 border-l-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Conversion Rate</p>
              <p className="text-2xl font-black text-white">{convRate.toFixed(1)}%</p>
            </div>
            <PieChart className="w-6 h-6 text-yellow-500/50" />
          </div>
        </Card>
      </div>

      {/* Kanban */}
      <div className="pt-4">
        <InvestorKanban investors={investors} />
      </div>

      <div className="pt-12 border-t border-zinc-900 opacity-20 italic">
        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest text-center">
          Investor Fundraising Engine v1.0.0 — Internal Capital Allocation Surface
        </p>
      </div>
    </div>
  );
}
