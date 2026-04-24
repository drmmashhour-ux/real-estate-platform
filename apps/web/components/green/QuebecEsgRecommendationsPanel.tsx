"use client";

import { QuebecEsgRecommendation } from "@/modules/green-ai/quebec-esg-recommendation.service";
import { QUEBEC_ESG_CRITERIA_DISCLAIMER } from "@/modules/green-ai/quebec-esg.engine";
import { AlertTriangle, ArrowUpCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  recommendations: QuebecEsgRecommendation[];
}

export function QuebecEsgRecommendationsPanel({ recommendations }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black uppercase italic tracking-tight text-white">Recommendations ESG</h3>
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-500">
          <ArrowUpCircle className="h-3 w-3" /> Potential Lift
        </div>
      </div>

      <div className="grid gap-4">
        {recommendations.map((rec) => (
          <div 
            key={rec.key} 
            className="group relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/40 p-5 transition-all hover:border-premium-gold/30"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full",
                    rec.priority === "high" ? "bg-red-500/20 text-red-400" : 
                    rec.priority === "medium" ? "bg-amber-500/20 text-amber-400" : 
                    "bg-zinc-800 text-zinc-400"
                  )}>
                    Priorité {rec.priority}
                  </span>
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500 italic">
                    Effort {rec.effort}
                  </span>
                </div>
                <h4 className="font-bold text-white tracking-tight">{rec.title}</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">{rec.description}</p>
              </div>
              <div className="flex flex-col items-end shrink-0">
                <span className="text-xl font-black text-premium-gold">+{rec.estimatedScoreLift}</span>
                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">points</span>
              </div>
            </div>

            <div className="mt-4 space-y-2 border-t border-white/5 pt-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 italic">Justification</p>
              <ul className="space-y-1">
                {rec.rationale.map((r, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-[10px] text-zinc-300 leading-relaxed">
                    <div className="mt-1 h-1 w-1 shrink-0 rounded-full bg-premium-gold/50" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-white/5 p-4 text-[10px] text-zinc-500 italic">
        <Info className="h-3 w-3 shrink-0" />
        <p>{QUEBEC_ESG_CRITERIA_DISCLAIMER}</p>
      </div>
    </div>
  );
}
