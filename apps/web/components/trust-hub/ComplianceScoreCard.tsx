"use client";

import { ComplianceScoreResult } from "@/modules/quebec-trust-hub/types";
import { cn } from "@/lib/utils";
import { ShieldCheck, ShieldAlert, Shield, ArrowRight } from "lucide-react";

interface Props {
  result: ComplianceScoreResult;
}

export function ComplianceScoreCard({ result }: Props) {
  const { score, status, missingItems, riskItems, recommendations } = result;

  const colorMap = {
    LOW: "text-red-500 bg-red-500/10 border-red-500/20",
    MEDIUM: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    HIGH: "text-blue-500 bg-blue-500/10 border-blue-500/20",
    READY: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  };

  const Icon = score >= 90 ? ShieldCheck : score >= 70 ? Shield : ShieldAlert;

  return (
    <div className="bnhub-panel-muted p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-sm font-black uppercase tracking-widest text-neutral-500 italic">Score de Conformité</h3>
          <p className="text-2xl font-black text-white italic tracking-tighter">
            {score}% <span className={cn("text-xs not-italic tracking-widest uppercase ml-2 px-2 py-0.5 rounded-full border", colorMap[status])}>{status}</span>
          </p>
        </div>
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", colorMap[status])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>

      <div className="space-y-4">
        {missingItems.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-red-500">Éléments manquants</p>
            <ul className="space-y-1">
              {missingItems.map((item, i) => (
                <li key={i} className="text-xs text-neutral-400 flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-red-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {riskItems.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Risques détectés</p>
            <ul className="space-y-1">
              {riskItems.map((item, i) => (
                <li key={i} className="text-xs text-neutral-400 flex items-center gap-2">
                  <span className="h-1 w-1 rounded-full bg-amber-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-white/5">
            <p className="text-[10px] font-black uppercase tracking-widest text-premium-gold">Recommandations Trust Hub</p>
            <ul className="space-y-1">
              {recommendations.map((item, i) => (
                <li key={i} className="text-xs text-neutral-200 font-bold flex items-center gap-2 italic">
                  <ArrowRight className="h-3 w-3 text-premium-gold" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
