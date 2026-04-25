import React, { useState } from "react";
import { HelpCircle, X, ChevronRight, AlertCircle, Info } from "lucide-react";
import { ClauseExplanation } from "../../modules/quebec-trust-hub/types";
import { cn } from "../../lib/utils";

interface Props {
  sectionKey: string;
  clauseText: string;
  draftId?: string;
  className?: string;
}

export const ExplainClauseButton: React.FC<Props> = ({ sectionKey, clauseText, draftId, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [explanation, setExplanation] = useState<ClauseExplanation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchExplanation = async () => {
    if (explanation) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/trust-hub/explain-clause", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionKey, clauseText, draftId }),
      });
      const data = await res.json();
      setExplanation(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => { setIsOpen(true); fetchExplanation(); }}
        className={cn("inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-[#D4AF37] transition font-medium", className)}
      >
        <HelpCircle className="w-3.5 h-3.5" />
        Comprendre cette clause
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-lg bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/40">
              <h3 className="text-lg font-bold text-[#D4AF37]">Guide de compréhension</h3>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition">
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                  <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-zinc-500 font-medium">Analyse de la clause...</p>
                </div>
              ) : explanation ? (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <p className="text-sm text-zinc-200 leading-relaxed font-medium">
                      {explanation.explanationFr}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-500" /> Points de risque
                    </h4>
                    <ul className="grid gap-2">
                      {explanation.risksFr.map((risk, i) => (
                        <li key={i} className="text-sm text-rose-200/80 flex items-start gap-2 bg-rose-500/5 p-2 rounded-lg">
                          <ChevronRight className="w-3.5 h-3.5 mt-1 shrink-0" />
                          {risk}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> À confirmer
                    </h4>
                    <ul className="grid gap-2">
                      {explanation.whatToConfirmFr.map((item, i) => (
                        <li key={i} className="text-sm text-zinc-300 flex items-start gap-2">
                          <div className="mt-1.5 w-1 h-1 rounded-full bg-emerald-500 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-2xl bg-zinc-800/50 border border-white/5">
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold text-[#D4AF37] uppercase">
                      <Info className="w-3.5 h-3.5" /> En résumé
                    </div>
                    <p className="text-sm text-zinc-400 italic">
                      {explanation.plainLanguageSummaryFr}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="p-6 bg-black/40 border-t border-white/5">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-3 rounded-2xl bg-zinc-800 text-white font-bold transition hover:bg-zinc-700"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Simple internal icon
const CheckCircle2 = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
);
