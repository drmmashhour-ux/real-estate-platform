import React from "react";
import { CapitalAllocationDecision } from "@/modules/capital-ai/capital-allocator.types";
import { Info, AlertCircle, Leaf } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function CapitalAllocationTable({ allocations }: { allocations: CapitalAllocationDecision[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-white/10 bg-white/5">
            <th className="px-4 py-3 text-[10px] font-bold text-[#737373] uppercase tracking-widest">Deal</th>
            <th className="px-4 py-3 text-[10px] font-bold text-[#737373] uppercase tracking-widest">Score</th>
            <th className="px-4 py-3 text-[10px] font-bold text-[#737373] uppercase tracking-widest">Allocation</th>
            <th className="px-4 py-3 text-[10px] font-bold text-[#737373] uppercase tracking-widest text-right">Amount</th>
            <th className="px-4 py-3 text-[10px] font-bold text-[#737373] uppercase tracking-widest">Risk/ESG</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {allocations.map((a) => (
            <tr key={a.dealId} className="group hover:bg-white/5 transition-colors">
              <td className="px-4 py-4">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">{a.title}</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="w-3 h-3 text-[#737373]" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-[10px] leading-relaxed">
                          <p className="font-bold mb-1">AI Rationale:</p>
                          <p>{a.rationale}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span className="text-[10px] text-[#737373] line-clamp-1">{a.expectedOutcome}</span>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-white">{(a.normalizedScore * 100).toFixed(0)}</span>
                  <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-premium-gold" 
                      style={{ width: `${a.normalizedScore * 100}%` }}
                    />
                  </div>
                </div>
              </td>
              <td className="px-4 py-4">
                <span className="text-sm font-mono text-[#B3B3B3]">{(a.allocationPercent * 100).toFixed(1)}%</span>
              </td>
              <td className="px-4 py-4 text-right">
                <span className="text-sm font-mono font-bold text-white">${a.allocatedAmount.toLocaleString()}</span>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    a.riskLevel === "LOW" ? "bg-emerald-500/20 text-emerald-500" :
                    a.riskLevel === "MEDIUM" ? "bg-amber-500/20 text-amber-500" :
                    "bg-rose-500/20 text-rose-500"
                  }`}>
                    {a.riskLevel}
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Leaf className={`w-3.5 h-3.5 ${a.esgImpact.includes("High") ? "text-emerald-500" : "text-[#737373]"}`} />
                      </TooltipTrigger>
                      <TooltipContent className="text-[10px]">
                        {a.esgImpact}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </td>
            </tr>
          ))}
          {allocations.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-10 text-center text-sm text-[#737373]">
                No allocations recommended for current criteria.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
