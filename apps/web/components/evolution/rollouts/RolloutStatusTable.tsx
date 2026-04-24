"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Rocket, 
  RotateCcw, 
  Pause, 
  ChevronRight, 
  Activity, 
  ShieldCheck,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface Rollout {
  id: string;
  status: string;
  rolloutPercent: number;
  updatedAt: string;
  policyAdjustment: {
    id: string;
    domain: string;
    kind: string;
    rationale: string;
  };
}

interface Props {
  rollouts: Rollout[];
  onAction?: () => void;
}

export function RolloutStatusTable({ rollouts, onAction }: Props) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function performAction(rolloutId: string, action: "advance" | "rollback") {
    setLoadingId(rolloutId);
    try {
      await fetch("/api/evolution/rollouts/action", {
        method: "POST",
        body: JSON.stringify({ rolloutId, action }),
      });
      onAction?.();
    } catch (err) {
      console.error("Rollout action failed", err);
    } finally {
      setLoadingId(null);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "COMPLETED": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "ROLLED_BACK": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "PAUSED": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default: return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
    }
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
        <h3 className="font-bold text-white flex items-center italic tracking-tighter uppercase">
          <Rocket className="w-5 h-5 text-blue-500 mr-2" />
          Active Policy Rollouts
        </h3>
        <Badge variant="outline" className="text-zinc-500 border-zinc-800 text-[10px] uppercase font-bold">
          Progressive Deployment
        </Badge>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-zinc-950 text-zinc-400 border-b border-zinc-800 text-[11px] uppercase font-black tracking-widest">
              <th className="p-4">Policy / Domain</th>
              <th className="p-4">Status</th>
              <th className="p-4">Exposure</th>
              <th className="p-4">Performance</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {rollouts.map((r) => (
              <tr key={r.id} className="hover:bg-zinc-800/30 transition-colors group">
                <td className="p-4">
                  <div>
                    <p className="font-bold text-white text-xs uppercase tracking-tight">
                      {r.policyAdjustment.kind}
                    </p>
                    <div className="flex items-center mt-1">
                      <Badge variant="outline" className="text-[9px] uppercase h-4 px-1 border-zinc-700 text-zinc-500">
                        {r.policyAdjustment.domain}
                      </Badge>
                      <span className="text-[10px] text-zinc-600 ml-2 italic truncate max-w-[200px]">
                        {r.policyAdjustment.rationale}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="p-4 text-center">
                  <Badge className={`text-[10px] py-0 px-2 font-bold ${getStatusColor(r.status)}`}>
                    {r.status}
                  </Badge>
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-24 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-700 ${r.status === "ROLLED_BACK" ? "bg-red-500" : "bg-blue-500"}`}
                        style={{ width: `${r.rolloutPercent}%` }}
                      />
                    </div>
                    <span className="text-white font-black text-xs tabular-nums w-8">{r.rolloutPercent}%</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center text-green-500 space-x-1">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-[10px] font-bold">+2.4%</span>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {r.status === "ACTIVE" && r.rolloutPercent < 100 && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 text-[10px] bg-zinc-900 border-zinc-800 text-blue-400 hover:text-blue-300"
                        onClick={() => performAction(r.id, "advance")}
                        disabled={loadingId === r.id}
                      >
                        Advance
                      </Button>
                    )}
                    {(r.status === "ACTIVE" || r.status === "COMPLETED") && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 text-[10px] bg-zinc-900 border-zinc-800 text-red-400 hover:text-red-300"
                        onClick={() => performAction(r.id, "rollback")}
                        disabled={loadingId === r.id}
                      >
                        Rollback
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {rollouts.length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-zinc-600 italic text-sm">
                  No active policy rollouts.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
