"use client";

import { useEffect, useState } from "react";
import { EmpireOverviewCards } from "@/components/empire/EmpireOverviewCards";
import { EntityPerformanceTable } from "@/components/empire/EntityPerformanceTable";
import { OwnershipGraphPanel } from "@/components/empire/OwnershipGraphPanel";
import { CapitalAllocationPanel } from "@/components/empire/CapitalAllocationPanel";
import { GovernanceAlertsPanel } from "@/components/empire/GovernanceAlertsPanel";
import { StrategicAllocationPanel } from "@/components/empire/StrategicAllocationPanel";
import { OrchestrationPrioritiesPanel } from "@/components/empire/OrchestrationPrioritiesPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { Crown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmpireDashboardClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/empire/overview");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to load empire data", err);
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
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-32 bg-zinc-800" />
          <Skeleton className="h-32 bg-zinc-800" />
          <Skeleton className="h-32 bg-zinc-800" />
          <Skeleton className="h-32 bg-zinc-800" />
        </div>
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-[400px] col-span-2 bg-zinc-800" />
          <Skeleton className="h-[400px] bg-zinc-800" />
        </div>
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
              Empire Control
            </h1>
          </div>
          <p className="text-zinc-500 font-medium tracking-tight uppercase text-xs">
            Multi-Company Orchestration & Governance Layer
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
          Refresh Control Data
        </Button>
      </div>

      {/* Top Stats */}
      <EmpireOverviewCards data={data.empireOverview} />

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <EntityPerformanceTable scorecards={data.performanceSummary.scorecards} />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <OwnershipGraphPanel ownerships={data.ownershipGraph} />
            <CapitalAllocationPanel capital={data.capitalSummary} />
          </div>
        </div>

        <div className="space-y-8">
          <StrategicAllocationPanel recommendations={data.strategicRecommendations} />
          <OrchestrationPrioritiesPanel priorities={data.orchestrationPriorities} />
          <GovernanceAlertsPanel alerts={data.strategicAlerts} />
          
          <Card className="bg-zinc-900 border-zinc-800 p-4 border-dashed">
            <h3 className="text-xs font-bold text-zinc-500 uppercase mb-3 tracking-widest italic">Expansion Pipelines</h3>
            <div className="space-y-2">
              <div className="p-3 bg-zinc-950 rounded border border-zinc-800/50 flex justify-between items-center opacity-50">
                <span className="text-xs font-bold text-zinc-400">New Territory: Dubai Residential</span>
                <span className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded">QUEUED</span>
              </div>
              <div className="p-3 bg-zinc-950 rounded border border-zinc-800/50 flex justify-between items-center opacity-50">
                <span className="text-xs font-bold text-zinc-400">New Entity: Fintech Services</span>
                <span className="text-[10px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded">IDLE</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="pt-12 border-t border-zinc-900 flex flex-col md:flex-row justify-between items-center opacity-30 italic">
        <p className="text-[10px] text-zinc-500 max-w-2xl">
          OPERATIONAL DISCLAIMER: This dashboard provides informational and operational control only. 
          It does not constitute legal, financial, or tax advice. Ownership and governance records are 
          subject to statutory filings and external audit.
        </p>
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-4 md:mt-0">
          Empire OS v1.0.0
        </p>
      </div>
    </div>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl overflow-hidden ${className}`}>
      {children}
    </div>
  );
}
