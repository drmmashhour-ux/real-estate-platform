import React from "react";
import { SaferChoice } from "../../modules/quebec-trust-hub/types";
import { Lightbulb, ArrowRight, AlertTriangle } from "lucide-react";
import { cn } from "../../lib/utils";

interface Props {
  choices: SaferChoice[];
  onSelectAction?: (choice: SaferChoice) => void;
  className?: string;
}

export const SaferChoicePanel: React.FC<Props> = ({ choices, onSelectAction, className }) => {
  if (choices.length === 0) return null;

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2 px-1">
        <Lightbulb className="w-5 h-5 text-amber-400" />
        <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-100">Alternatives plus sûres</h3>
      </div>
      
      <div className="grid gap-3">
        {choices.map((choice) => (
          <div 
            key={choice.issueKey}
            className="group relative overflow-hidden rounded-xl border border-white/10 bg-zinc-900/50 p-4 transition hover:border-amber-500/30"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-500/80 uppercase">
                  <AlertTriangle className="w-3 h-3" /> {choice.issueKey.replace(/_/g, " ")}
                </div>
                <p className="text-sm text-zinc-400 leading-snug">{choice.currentRisk}</p>
              </div>
            </div>

            <div className="bg-amber-500/5 rounded-lg p-3 border border-amber-500/10">
              <div className="flex items-center gap-2 mb-1 text-amber-200 text-sm font-bold">
                <ArrowRight className="w-4 h-4" /> Option suggérée
              </div>
              <p className="text-sm text-zinc-200 mb-2 font-medium">{choice.saferOptionFr}</p>
              <p className="text-xs text-zinc-400 italic">{choice.reasonFr}</p>
            </div>

            {choice.actionRequired && (
              <button
                onClick={() => onSelectAction?.(choice)}
                className="mt-4 w-full py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold transition hover:bg-amber-500/20"
              >
                Appliquer cette modification
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
