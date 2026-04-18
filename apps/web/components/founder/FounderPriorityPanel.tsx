"use client";

import type { FounderIntelligenceSnapshot } from "@/modules/founder-intelligence/founder-intelligence.types";
import type { FounderCopilotRunResult } from "@/modules/founder-copilot/founder-copilot.types";

export function FounderPriorityPanel({
  snapshot,
  copilot,
}: {
  snapshot: FounderIntelligenceSnapshot;
  copilot: FounderCopilotRunResult;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5">
      <h3 className="text-sm font-semibold text-zinc-100">Priorités & risques (faits)</h3>
      <ul className="mt-3 space-y-2 text-sm text-zinc-300">
        {snapshot.decisionNow.map((d) => (
          <li key={d}>• {d}</li>
        ))}
      </ul>
      <h4 className="mt-4 text-xs font-medium uppercase tracking-wide text-zinc-500">Risques (delta fenêtre)</h4>
      <ul className="mt-2 space-y-1 text-sm text-amber-200/90">
        {copilot.risks.map((r) => (
          <li key={r}>− {r}</li>
        ))}
      </ul>
      <h4 className="mt-4 text-xs font-medium uppercase tracking-wide text-zinc-500">Opportunités (delta fenêtre)</h4>
      <ul className="mt-2 space-y-1 text-sm text-emerald-200/90">
        {copilot.opportunities.map((r) => (
          <li key={r}>+ {r}</li>
        ))}
      </ul>
    </div>
  );
}
