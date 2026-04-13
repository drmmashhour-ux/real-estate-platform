"use client";

import { suggestBrokerNextAction } from "@/lib/ai/brain";
import type { LeadInput } from "@/lib/ai/lead-scoring";

type BrokerAiPanelProps = {
  leadContext?: LeadInput | null;
};

export function BrokerAiPanel({ leadContext }: BrokerAiPanelProps) {
  const suggestion = suggestBrokerNextAction(leadContext ?? {});

  return (
    <div className="rounded-xl border border-ds-border bg-ds-card p-5 shadow-ds-soft">
      <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-ds-gold">Broker copilot</h3>
      <p className="mt-2 text-[11px] leading-snug text-ds-text-secondary">
        Rule-based hints from this lead&apos;s text and contact fields — not a prediction of closing.
      </p>
      <ul className="mt-4 space-y-3 text-sm">
        <li>
          <span className="text-ds-text-secondary">Priority band:</span>{" "}
          <span className="font-medium capitalize text-ds-text">{suggestion.priority}</span>
        </li>
        <li>
          <span className="text-ds-text-secondary">Suggested next step:</span>{" "}
          <span className="text-ds-text">{suggestion.action}</span>
        </li>
        <li>
          <span className="text-ds-text-secondary">Draft reply:</span>{" "}
          <span className="italic text-ds-text/95">&quot;{suggestion.messageSuggestion}&quot;</span>
        </li>
        <li>
          <span className="text-ds-text-secondary">Lead fit score:</span>{" "}
          <span className="font-semibold tabular-nums text-ds-gold">{suggestion.leadFitScore}</span>
          <span className="text-ds-text-secondary"> /100</span>
        </li>
        <li className="border-t border-ds-border pt-3 text-xs text-ds-text-secondary">
          <span className="font-medium text-ds-text/90">Why:</span> {suggestion.rationale}
        </li>
      </ul>
    </div>
  );
}
