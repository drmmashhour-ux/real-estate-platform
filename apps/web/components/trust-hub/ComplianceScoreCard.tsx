import React from "react";
import { ComplianceScoreResult } from "../../modules/quebec-trust-hub/types";
import { cn } from "../../lib/utils";
import { Shield, AlertTriangle, CheckCircle, Info } from "lucide-react";

interface Props {
  result: ComplianceScoreResult;
  className?: string;
}

export const ComplianceScoreCard: React.FC<Props> = ({ result, className }) => {
  const { score, status, missingItems, riskItems, recommendations } = result;

  const getStatusColor = () => {
    switch (status) {
      case "READY": return "text-emerald-400 border-emerald-500/30 bg-emerald-500/5";
      case "HIGH": return "text-blue-400 border-blue-500/30 bg-blue-500/5";
      case "MEDIUM": return "text-amber-400 border-amber-500/30 bg-amber-500/5";
      case "LOW": return "text-rose-400 border-rose-500/30 bg-rose-500/5";
      default: return "text-zinc-400 border-zinc-500/30 bg-zinc-500/5";
    }
  };

  const getScoreColor = () => {
    if (score >= 90) return "text-emerald-400";
    if (score >= 70) return "text-blue-400";
    if (score >= 50) return "text-amber-400";
    return "text-rose-400";
  };

  return (
    <div className={cn("rounded-2xl border bg-black/40 p-6 backdrop-blur-xl", getStatusColor(), className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="w-6 h-6" />
          <h3 className="text-lg font-bold">Indice de Conformité Québec</h3>
        </div>
        <div className={cn("text-3xl font-black", getScoreColor())}>
          {score}%
        </div>
      </div>

      <div className="space-y-4">
        {missingItems.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider opacity-60 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3" /> Éléments manquants
            </p>
            <ul className="grid grid-cols-1 gap-1">
              {missingItems.map((item, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-rose-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {riskItems.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider opacity-60 flex items-center gap-1.5">
              <Info className="w-3 h-3" /> Points de vigilance
            </p>
            <ul className="grid grid-cols-1 gap-1">
              {riskItems.map((item, idx) => (
                <li key={idx} className="text-sm flex items-start gap-2 text-zinc-300">
                  <span className="mt-1.5 w-1 h-1 rounded-full bg-amber-500 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-2">Recommandations</p>
            <div className="space-y-2">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-zinc-100">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                  {rec}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 text-[10px] opacity-40 italic leading-tight text-center">
        Cet indice est fourni à titre informatif et ne remplace pas l'avis d'un professionnel.
      </div>
    </div>
  );
};
