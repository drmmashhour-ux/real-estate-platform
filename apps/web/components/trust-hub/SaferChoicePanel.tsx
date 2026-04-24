"use client";

import { SaferChoice } from "@/modules/quebec-trust-hub/types";
import { Lightbulb, ArrowRight, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  choices: SaferChoice[];
}

export function SaferChoicePanel({ choices }: Props) {
  if (choices.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="bg-premium-gold/20 p-1.5 rounded-lg">
          <Lightbulb className="h-4 w-4 text-premium-gold" />
        </div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-premium-gold">Alternatives plus sûres (LECIPM)</h3>
      </div>

      <div className="grid gap-4">
        {choices.map((choice) => (
          <div key={choice.issueKey} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] p-5 transition-all hover:border-premium-gold/30 hover:bg-premium-gold/[0.02]">
            <div className="absolute right-0 top-0 h-24 w-24 translate-x-1/2 -translate-y-1/2 bg-premium-gold/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 italic">Risque identifié</p>
                <p className="text-xs text-neutral-400 leading-relaxed">{choice.currentRisk}</p>
              </div>

              <div className="space-y-1 pl-4 border-l border-premium-gold/30">
                <p className="text-[10px] font-black uppercase tracking-widest text-premium-gold italic flex items-center gap-1.5">
                  <ShieldCheck className="h-3 w-3" />
                  Option recommandée
                </p>
                <p className="text-xs text-white font-bold italic">{choice.saferOptionFr}</p>
                <p className="text-[10px] text-neutral-500 italic mt-1">{choice.reasonFr}</p>
              </div>
              
              {choice.actionRequired && (
                <button className="w-full mt-2 py-2 rounded-xl bg-premium-gold/10 border border-premium-gold/20 text-premium-gold text-[10px] font-black uppercase tracking-widest hover:bg-premium-gold/20 transition-all">
                  Appliquer la modification →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
