import React from "react";
import { ShieldAlert, AlertTriangle, X, ChevronRight } from "lucide-react";
import { ProtectionModeStatus } from "../../modules/quebec-trust-hub/types";
import { cn } from "../../lib/utils";

interface Props {
  status: ProtectionModeStatus;
  onAcknowledge?: () => void;
  className?: string;
}

export const ProtectionModeBanner: React.FC<Props> = ({ status, onAcknowledge, className }) => {
  if (!status.enabled) return null;

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5 backdrop-blur-xl animate-in fade-in slide-in-from-top-4", className)}>
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <ShieldAlert className="w-24 h-24" />
      </div>

      <div className="relative flex flex-col md:flex-row items-start gap-6">
        <div className="shrink-0 p-3 rounded-2xl bg-rose-500/20 text-rose-500">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="flex-1 space-y-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-rose-100 flex items-center gap-2">
              Mode de Protection Activé
            </h3>
            <p className="text-sm text-rose-200/60 leading-relaxed">
              Des facteurs de risque importants ont été détectés dans votre démarche. Le système a ralenti le processus pour assurer votre sécurité.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {status.reasons.map((reason, idx) => (
              <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-300">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                {reason}
              </span>
            ))}
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              onClick={onAcknowledge}
              className="px-6 py-2.5 rounded-xl bg-rose-500 text-white font-bold text-sm shadow-lg shadow-rose-500/20 transition hover:brightness-110 active:scale-95 flex items-center justify-center gap-2"
            >
              J'ai pris connaissance des risques
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-rose-100 font-bold text-sm transition hover:bg-white/10"
            >
              Demander l'aide d'un expert
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
