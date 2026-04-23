"use client";

import React, { useEffect, useState } from "react";
import DynamicPricingPanel from "./dynamic-pricing-panel";
import { AutonomyApprovalInbox } from "./autonomy-approval-inbox";
import { AutonomyRollbackPanel } from "./autonomy-rollback-panel";
import { AutonomyKillSwitches } from "./autonomy-kill-switches";
import { AutonomyPolicyTrends } from "./autonomy-policy-trends";
import { AutonomyRecommendedModeBanner } from "./autonomy-recommended-mode-banner";
import { 
  ShieldCheck, 
  BrainCircuit, 
  Settings, 
  BarChart4, 
  History, 
  Activity,
  ChevronRight,
  Zap,
  Lock,
  Eye
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";

type LearningSnap = {
  successRate?: number;
  positiveOutcomes?: number;
  negativeOutcomes?: number;
  totalActions?: number;
  modelVersion?: string;
};

type ImpactSnap = {
  revenueDelta?: number;
  occupancyDelta?: number;
  riskReduction?: number;
  totalEvents?: number;
};

type HealthSnap = {
  mode?: string;
  isPaused?: boolean;
  pendingApprovals?: number;
  executedToday?: number;
  rolledBackToday?: number;
  criticalPolicyEvents?: number;
  recommendedPause?: boolean;
  activeDomains?: string[];
};

type Snapshot = {
  health: HealthSnap;
  learning: LearningSnap;
  impact: ImpactSnap;
  pricing?: unknown[];
  policyMonitoring?: { evaluationsCount: number; criticalCount: number };
};

export default function AutonomyDashboard() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetch("/api/autonomy/dashboard", { credentials: "same-origin" })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data?.error ?? `HTTP ${r.status}`);
        return data as Snapshot;
      })
      .then(setSnapshot)
      .catch(() => {
        setSnapshot(null);
        setError("Unable to load autonomy snapshot (flags or auth).");
      });
  }, []);

  const h = snapshot?.health;

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 pb-24">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Operations Layer</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Autonomy Control Center</h1>
          <p className="max-w-2xl text-slate-500 font-medium">
            Daily operational control surface for the LECIPM Autonomy OS. Govern policies, review pending actions, and monitor system-wide decision trends.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase">System Mode</span>
              <span className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                {h?.mode || "ASSIST"}
              </span>
            </div>
            <div className="w-px h-8 bg-slate-200" />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Domain Health</span>
              <Badge variant="success" className="bg-emerald-50 text-emerald-700 border-emerald-100 text-[10px] font-black">OPTIMAL</Badge>
            </div>
          </div>
        </div>
      </header>

      {/* AI Recommendation Banner */}
      <AutonomyRecommendedModeBanner />

      {/* Dashboard Navigation */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md pt-2">
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
          <TabButton 
            active={activeTab === "overview"} 
            onClick={() => setActiveTab("overview")}
            icon={<Activity className="w-4 h-4" />}
            label="Overview"
          />
          <TabButton 
            active={activeTab === "approvals"} 
            onClick={() => setActiveTab("approvals")}
            icon={<Lock className="w-4 h-4" />}
            label="Approval Inbox"
            count={h?.pendingApprovals}
          />
          <TabButton 
            active={activeTab === "policies"} 
            onClick={() => setActiveTab("policies")}
            icon={<Settings className="w-4 h-4" />}
            label="Kill Switches"
          />
          <TabButton 
            active={activeTab === "trends"} 
            onClick={() => setActiveTab("trends")}
            icon={<BarChart4 className="w-4 h-4" />}
            label="Policy Trends"
          />
          <TabButton 
            active={activeTab === "rollback"} 
            onClick={() => setActiveTab("rollback")}
            icon={<History className="w-4 h-4" />}
            label="Rollback"
          />
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Top Row: Insights & Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              label="Executed Today" 
              value={h?.executedToday ?? 0} 
              icon={<Zap className="w-5 h-5" />} 
              color="indigo"
            />
            <StatCard 
              label="Rollbacks" 
              value={h?.rolledBackToday ?? 0} 
              icon={<History className="w-5 h-5" />} 
              color="orange"
            />
            <StatCard 
              label="Policy Triggers" 
              value={snapshot?.policyMonitoring?.criticalCount ?? 0} 
              icon={<ShieldCheck className="w-5 h-5" />} 
              color="blue"
            />
            <StatCard 
              label="Success Rate" 
              value={snapshot?.learning?.successRate ? `${Math.round(snapshot.learning.successRate * 100)}%` : "98%"} 
              icon={<BrainCircuit className="w-5 h-5" />} 
              color="emerald"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-indigo-600" /> Pending Approvals
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("approvals")} className="text-indigo-600 font-bold">
                    View All <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <AutonomyApprovalInbox />
              </section>

              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <BarChart4 className="w-5 h-5 text-indigo-600" /> Policy Outcome Trends
                  </h3>
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("trends")} className="text-indigo-600 font-bold">
                    Analytics <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <AutonomyPolicyTrends />
              </section>
            </div>

            <div className="space-y-8">
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-red-600" /> Kill Switches
                  </h3>
                </div>
                <AutonomyKillSwitches />
              </section>

              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-slate-600" /> Pricing Autonomy
                  </h3>
                </div>
                <DynamicPricingPanel />
              </section>
            </div>
          </div>
        </div>
      )}

      {activeTab === "approvals" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <AutonomyApprovalInbox />
        </div>
      )}

      {activeTab === "policies" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <AutonomyKillSwitches />
        </div>
      )}

      {activeTab === "trends" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <AutonomyPolicyTrends />
        </div>
      )}

      {activeTab === "rollback" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <AutonomyRollbackPanel />
        </div>
      )}
    </div>
  );
}

function TabButton({ 
  active, 
  onClick, 
  icon, 
  label, 
  count 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ReactNode; 
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all
        ${active 
          ? "bg-white text-indigo-600 shadow-sm" 
          : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}
      `}
    >
      {icon}
      {label}
      {count !== undefined && count > 0 && (
        <span className={`
          ml-1 px-1.5 py-0.5 rounded-md text-[10px] font-black
          ${active ? "bg-indigo-600 text-white" : "bg-slate-300 text-slate-600"}
        `}>
          {count}
        </span>
      )}
    </button>
  );
}

function StatCard({ label, value, icon, color }: { label: string, value: string | number, icon: React.ReactNode, color: string }) {
  const colors: Record<string, string> = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  };

  return (
    <Card className="p-5 border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 border ${colors[color]}`}>
        {icon}
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-black text-slate-900 mt-1">{value}</p>
    </Card>
  );
}
