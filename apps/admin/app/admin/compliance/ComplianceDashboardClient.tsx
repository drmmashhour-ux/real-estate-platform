"use client";

import { useEffect, useState } from "react";
import { ComplianceOverview } from "@/components/compliance/ComplianceOverview";
import { FinancialTransparencyPanel } from "@/components/compliance/FinancialTransparencyPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, RefreshCw, FileText, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AutopilotActionPanel } from "@/components/ai-autopilot/AutopilotActionPanel";

export function ComplianceDashboardClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch("/api/compliance/consents");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to load compliance data", err);
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
        <Skeleton className="h-48 w-full bg-zinc-800" />
        <div className="grid grid-cols-2 gap-6">
          <Skeleton className="h-32 bg-zinc-800" />
          <Skeleton className="h-32 bg-zinc-800" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 min-h-screen bg-black text-zinc-100 pb-24">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <ShieldCheck className="w-8 h-8 text-emerald-500 fill-emerald-500/10" />
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
              Regulatory Compliance
            </h1>
          </div>
          <p className="text-zinc-500 font-medium tracking-tight uppercase text-xs">
            OACIQ & AMF Alignment Layer — Transparency and Data Sovereignty
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
          Refresh Consents
        </Button>
      </div>

      <ComplianceOverview 
        consents={data?.consents || []} 
        onRefresh={loadData}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <FinancialTransparencyPanel 
          feeStructure={{
            platformFeePercent: 3.5,
            brokerCommissionPercent: 5.0,
            taxes: "GST/QST"
          }}
        />
        
        <Card className="p-6 bg-zinc-900 border-zinc-800 border-l-4 border-l-emerald-500">
          <div className="flex items-start justify-between">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h4 className="font-black text-white uppercase italic tracking-tighter">OACIQ Identity Verification</h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                Mandatory verification of broker identity and license status. All platform communications must clearly state the role of the individual as a licensed broker or platform representative.
              </p>
              <Button size="sm" variant="outline" className="bg-zinc-950 border-zinc-800 text-[10px] uppercase font-black tracking-widest h-8">
                View Verification Registry
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-4 bg-zinc-900 border-zinc-800 border-t-2 border-t-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">OACIQ Verification</p>
              <p className="text-xl font-black text-white">SYSTEM ACTIVE</p>
            </div>
            <FileText className="w-6 h-6 text-emerald-500/50" />
          </div>
        </Card>

        <Card className="p-4 bg-zinc-900 border-zinc-800 border-t-2 border-t-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Audit Trail (24h)</p>
              <p className="text-xl font-black text-white">128 LOGS</p>
            </div>
            <Activity className="w-6 h-6 text-blue-500/50" />
          </div>
        </Card>

        <Card className="p-4 bg-zinc-900 border-zinc-800 border-t-2 border-t-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Active Disclaimers</p>
              <p className="text-xl font-black text-white">4 MANDATORY</p>
            </div>
            <ShieldCheck className="w-6 h-6 text-orange-500/50" />
          </div>
        </Card>
      </div>

      <div className="max-w-3xl">
        <AutopilotActionPanel showModeSelector title="AI Autopilot — conformité admin" />
      </div>

      <div className="pt-12 border-t border-zinc-900 opacity-20 italic">
        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest text-center">
          Compliance Alignment Engine v2.0.4 — Law 25 & AMF/OACIQ Standard Enforcement
        </p>
      </div>
    </div>
  );
}
