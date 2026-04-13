"use client";

import { suggestBrokerNextAction } from "@/lib/ai/brain";
import type { LeadInput } from "@/lib/ai/lead-scoring";

type BrokerAiPanelProps = {
  leadContext?: LeadInput | null;
  accent?: string;
};

export function BrokerAiPanel({ leadContext, accent = "#10b981" }: BrokerAiPanelProps) {
  const suggestion = suggestBrokerNextAction(leadContext ?? {});

  return (
    <div
      className="rounded-xl border p-4"
      style={{
        backgroundColor: "rgba(255,255,255,0.04)",
        borderColor: `${accent}40`,
      }}
    >
      <h3 className="text-sm font-semibold uppercase tracking-wider" style={{ color: accent }}>
        Broker AI Assistant
      </h3>
      <ul className="mt-3 space-y-2 text-sm">
        <li>
          <span className="text-slate-400">Prioritize:</span>{" "}
          <span className="font-medium capitalize">{suggestion.priority}</span> priority leads first
        </li>
        <li>
          <span className="text-slate-400">Next action:</span>{" "}
          <span className="text-white">{suggestion.action}</span>
        </li>
        <li>
          <span className="text-slate-400">Suggested message:</span>{" "}
          <span className="text-slate-300 italic">&quot;{suggestion.messageSuggestion}&quot;</span>
        </li>
        <li>
          <span className="text-slate-400">Close probability:</span>{" "}
          <span style={{ color: accent }}>{suggestion.closeProbabilityPct}%</span>
        </li>
      </ul>
    </div>
  );
}
