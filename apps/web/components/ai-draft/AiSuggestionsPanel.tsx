"use client";

import type { AiCorrectionSuggestion } from "@/modules/ai-drafting-correction/types";

type Props = {
  suggestions: AiCorrectionSuggestion[];
  loading?: boolean;
};

export function AiSuggestionsPanel({ suggestions, loading }: Props) {
  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/50 p-4 text-sm text-slate-400" role="status">
        Génération des suggestions…
      </div>
    );
  }

  if (!suggestions.length) {
    return (
      <p className="text-sm text-slate-500">Aucune suggestion pour le moment.</p>
    );
  }

  return (
    <ul className="space-y-2">
      {suggestions.map((s) => (
        <li
          key={s.suggestionKey}
          className="rounded-lg border border-premium-gold/20 bg-white/[0.03] p-3 text-sm text-slate-200"
        >
          {s.fieldKey ? (
            <p className="text-xs font-mono text-premium-gold/80">{s.fieldKey}</p>
          ) : null}
          <p className="mt-1">{s.messageFr}</p>
          <p className="mt-1 text-xs text-slate-500">{s.actionType}</p>
        </li>
      ))}
    </ul>
  );
}
