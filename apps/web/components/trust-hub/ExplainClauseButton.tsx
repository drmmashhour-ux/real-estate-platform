"use client";

import { useState } from "react";
import { Info, HelpCircle, X } from "lucide-react";
import { ClauseExplanation } from "@/modules/quebec-trust-hub/types";

interface Props {
  sectionKey: string;
  clauseText: string;
  draftId?: string;
}

export function ExplainClauseButton({ sectionKey, clauseText, draftId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [explanation, setExplanation] = useState<ClauseExplanation | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleExplain() {
    setIsOpen(true);
    if (explanation) return;

    setLoading(true);
    try {
      const res = await fetch("/api/trust-hub/explain-clause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionKey, clauseText, draftId })
      });
      const data = await res.json();
      setExplanation(data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button 
        onClick={handleExplain}
        className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-neutral-500 hover:text-premium-gold transition-colors"
      >
        <HelpCircle className="h-3 w-3" />
        Comprendre la clause
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-3xl border border-white/10 bg-zinc-950 p-8 shadow-2xl overflow-hidden">
            <div className="absolute right-0 top-0 h-40 w-40 translate-x-1/2 -translate-y-1/2 bg-premium-gold/10 blur-[100px]" />
            
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black uppercase italic tracking-tighter text-white">
                Expertise <span className="text-premium-gold">LECIPM</span>
              </h3>
              <button onClick={() => setIsOpen(false)} className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
                <X className="h-4 w-4 text-white" />
              </button>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center gap-4">
                <div className="h-10 w-10 border-2 border-premium-gold/30 border-t-premium-gold rounded-full animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Analyse de la clause...</p>
              </div>
            ) : explanation && (
              <div className="space-y-6">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-premium-gold">Explication simple</p>
                  <p className="text-sm text-neutral-200 leading-relaxed italic">&ldquo;{explanation.explanationFr}&rdquo;</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-red-500">Risques potentiels</p>
                    <p className="text-xs text-neutral-400">{explanation.risksFr}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Points à confirmer</p>
                    <p className="text-xs text-neutral-400">{explanation.whatToConfirmFr}</p>
                  </div>
                </div>

                <div className="bg-white/5 p-4 rounded-2xl">
                  <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">En résumé</p>
                  <p className="text-xs font-bold text-white italic">{explanation.plainLanguageSummaryFr}</p>
                </div>

                <div className="pt-6 border-t border-white/5">
                  <p className="text-[9px] text-neutral-600 italic text-center">
                    {explanation.disclaimerFr}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
