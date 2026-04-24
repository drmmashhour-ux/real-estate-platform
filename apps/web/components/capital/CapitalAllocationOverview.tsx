import React from "react";
import { CapitalAllocationPlan } from "@/modules/capital-ai/capital-allocator.types";
import { DollarSign, PieChart, TrendingUp, ShieldCheck } from "lucide-react";

export function CapitalAllocationOverview({ plan }: { plan: CapitalAllocationPlan }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="rounded-xl border border-white/10 bg-black/40 p-4">
        <div className="flex items-center gap-2 mb-2 text-[#737373]">
          <DollarSign className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Total Capital</span>
        </div>
        <div className="text-xl font-mono font-bold text-white">
          ${plan.totalCapital.toLocaleString()}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/40 p-4">
        <div className="flex items-center gap-2 mb-2 text-emerald-500">
          <PieChart className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Allocated</span>
        </div>
        <div className="text-xl font-mono font-bold text-white">
          ${plan.allocatedCapital.toLocaleString()}
        </div>
        <div className="text-[10px] text-[#737373] mt-1">
          {((plan.allocatedCapital / plan.totalCapital) * 100).toFixed(1)}% of total
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/40 p-4">
        <div className="flex items-center gap-2 mb-2 text-blue-500">
          <TrendingUp className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Diversification</span>
        </div>
        <div className="text-xl font-mono font-bold text-white">
          {(plan.diversificationScore * 100).toFixed(0)}%
        </div>
        <div className="w-full h-1 bg-white/5 rounded-full mt-2">
          <div 
            className="h-full bg-blue-500 rounded-full" 
            style={{ width: `${plan.diversificationScore * 100}%` }}
          />
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/40 p-4">
        <div className="flex items-center gap-2 mb-2 text-amber-500">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Risk Score</span>
        </div>
        <div className="text-xl font-mono font-bold text-white">
          {(plan.riskScore * 100).toFixed(0)}%
        </div>
        <div className="w-full h-1 bg-white/5 rounded-full mt-2">
          <div 
            className={plan.riskScore > 0.7 ? "h-full bg-rose-500 rounded-full" : "h-full bg-amber-500 rounded-full"} 
            style={{ width: `${plan.riskScore * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
