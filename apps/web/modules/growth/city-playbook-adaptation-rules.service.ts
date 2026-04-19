/**
 * Deterministic rule mapping: observed gaps → human review suggestions (no auto-execution).
 */

import type { CityPlaybookGap } from "@/modules/growth/city-playbook-gap.service";

export type AdaptationRuleOutput = {
  suggestions: string[];
  constraints: string[];
};

const BASE_CONSTRAINTS = [
  "Internal operator review only — no automated outreach or playbook sends.",
  "Treat suggestions as hypotheses; verify attribution and CRM hygiene before operational changes.",
];

export function applyAdaptationRules(gaps: CityPlaybookGap[]): AdaptationRuleOutput {
  const suggestions: string[] = [];

  for (const g of gaps) {
    if (g.kind === "thin_data") {
      suggestions.push("Collect more attributed Fast Deal events before tightening playbook expectations.");
      continue;
    }
    if (g.kind === "capture") {
      if (g.severity === "high") {
        suggestions.push("Increase broker sourcing activity and refine search queries — capture gap is large vs reference.");
      } else {
        suggestions.push("Increase sourcing activity and refine queries — capture ratio trails the reference profile.");
      }
    }
    if (g.kind === "playbook") {
      suggestions.push("Focus on completing playbook steps inside the 48h window — completion ratio trails reference.");
    }
    if (g.kind === "progression") {
      suggestions.push("Improve lead qualification discipline and broker matching checks — progression ratio trails reference.");
    }
    if (g.kind === "completion_time") {
      suggestions.push("Prioritize faster follow-up in the first 24h — playbook execution is slower than the reference city.");
    }
  }

  return {
    suggestions: dedupeKeepOrder(suggestions),
    constraints: [...BASE_CONSTRAINTS],
  };
}

function dedupeKeepOrder(lines: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const l of lines) {
    if (seen.has(l)) continue;
    seen.add(l);
    out.push(l);
  }
  return out;
}
