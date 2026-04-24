"use client";

import { ProtectionModeStatus } from "@/modules/quebec-trust-hub/types";
import { ShieldAlert, ArrowRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  status: ProtectionModeStatus;
}

export function ProtectionModeBanner({ status }: Props) {
  if (!status.enabled) return null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-red-500/30 bg-gradient-to-r from-red-950/20 to-black p-6 shadow-2xl">
      <div className="absolute right-0 top-0 h-32 w-32 translate-x-1/2 -translate-y-1/2 bg-red-500/10 blur-3xl" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/20 animate-pulse">
            <ShieldAlert className="h-6 w-6 text-red-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-red-500 italic">Protection Renforcée Active</h3>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {status.reasonsFr.map((reason, i) => (
                <span key={i} className="text-[10px] font-bold text-neutral-400 italic">
                  • {reason}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Actions recommandées</p>
          <div className="flex flex-col gap-2">
            {status.recommendedActionsFr.map((action, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-bold text-white italic">
                <ArrowRight className="h-3 w-3 text-red-500" />
                {action}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10">
          <Lock className="h-4 w-4 text-neutral-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Flux de signature sécurisé</span>
        </div>
      </div>
    </div>
  );
}
