"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  RefreshCw,
  Lock,
  Unlock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Check {
  id: string;
  name: string;
  status: "PASS" | "FAIL" | "WARNING";
  message?: string;
}

interface Report {
  timestamp: string;
  checks: Check[];
  status: "PASS" | "FAIL" | "WARNING";
}

export function AcceptanceDashboardClient() {
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadReport() {
    setLoading(true);
    try {
      const res = await fetch("/api/acceptance/report");
      const json = await res.json();
      setReport(json);
    } catch (err) {
      console.error("Failed to load acceptance report", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReport();
  }, []);

  if (loading && !report) {
    return (
      <div className="p-6 space-y-6 animate-pulse bg-black min-h-screen">
        <Skeleton className="h-12 w-64 bg-zinc-800" />
        <Skeleton className="h-32 w-full bg-zinc-800" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full bg-zinc-800" />)}
        </div>
      </div>
    );
  }

  if (!report) return <div className="p-8 text-white bg-black min-h-screen">Error loading report.</div>;

  const getOverallIcon = () => {
    switch (report.status) {
      case "PASS": return <ShieldCheck className="w-12 h-12 text-green-500" />;
      case "WARNING": return <ShieldAlert className="w-12 h-12 text-yellow-500" />;
      case "FAIL": return <ShieldX className="w-12 h-12 text-red-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PASS": return <Badge className="bg-green-500/10 text-green-500 border-green-500/20 uppercase font-black text-[10px]">Pass</Badge>;
      case "WARNING": return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 uppercase font-black text-[10px]">Warning</Badge>;
      case "FAIL": return <Badge className="bg-red-500/10 text-red-500 border-red-500/20 uppercase font-black text-[10px]">Fail</Badge>;
    }
  };

  const getCheckIcon = (status: string) => {
    switch (status) {
      case "PASS": return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "WARNING": return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "FAIL": return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  return (
    <div className="p-6 space-y-8 min-h-screen bg-black text-zinc-100 pb-24">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <ShieldCheck className="w-8 h-8 text-blue-500 fill-blue-500/10" />
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
              Final Acceptance
            </h1>
          </div>
          <p className="text-zinc-500 font-medium tracking-tight uppercase text-xs">
            Deterministic Safety Checklist for Autonomous Evolution
          </p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={loadReport}
          disabled={loading}
          className="bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Rerun Checks
        </Button>
      </div>

      {/* Hero Status */}
      <Card className={`p-8 border-2 transition-all duration-700 ${
        report.status === "PASS" ? "bg-green-500/5 border-green-500/20" : 
        report.status === "FAIL" ? "bg-red-500/5 border-red-500/20" : 
        "bg-yellow-500/5 border-yellow-500/20"
      }`}>
        <div className="flex items-center space-x-6">
          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 shadow-2xl">
            {getOverallIcon()}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h2 className="text-3xl font-black uppercase tracking-tighter italic">
                {report.status === "PASS" ? "System Ready" : report.status === "FAIL" ? "System Blocked" : "Safety Warning"}
              </h2>
              {report.status === "FAIL" ? <Lock className="w-5 h-5 text-red-500" /> : <Unlock className="w-5 h-5 text-green-500" />}
            </div>
            <p className="text-zinc-400 mt-2 text-sm max-w-2xl font-medium">
              {report.status === "PASS" 
                ? "All critical safety and consistency checks have passed. Autonomous evolution loops are enabled." 
                : report.status === "FAIL"
                ? "One or more critical safety checks failed. All automated policy rollouts and experiments are globally blocked."
                : "System is operational but warnings were detected. Manual supervision is recommended during evolution steps."}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Last Verification</p>
            <p className="text-sm font-bold text-zinc-300">{new Date(report.timestamp).toLocaleString()}</p>
          </div>
        </div>
      </Card>

      {/* Checklist Items */}
      <div className="grid grid-cols-1 gap-4">
        {report.checks.map((check) => (
          <Card key={check.id} className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800/50 transition-colors p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-black/40 rounded-lg">
                  {getCheckIcon(check.status)}
                </div>
                <div>
                  <h4 className="font-bold text-white uppercase text-xs tracking-tight">{check.name}</h4>
                  <p className="text-xs text-zinc-500 mt-0.5">{check.message}</p>
                </div>
              </div>
              {getStatusBadge(check.status)}
            </div>
          </Card>
        ))}
      </div>

      {/* Footer Info */}
      <div className="pt-12 border-t border-zinc-900 text-center space-y-2">
        <p className="text-[10px] text-zinc-600 uppercase font-black tracking-[0.2em]">
          Deterministic Acceptance Protocol v2.1 — Lebanon/Syria Hybrid Cloud Enforcement
        </p>
        <p className="text-[9px] text-zinc-700 italic">
          Blocking rules: Policy rollout (rollout.engine.ts), Experiment start (experiment-orchestrator.service.ts)
        </p>
      </div>
    </div>
  );
}
