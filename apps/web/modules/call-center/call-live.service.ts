import type { ScriptContext } from "@/modules/sales-scripts/sales-script.types";

import type { CallStage } from "@/modules/call-assistant/call-assistant.types";
import { getIntelSuggestions } from "@/modules/call-intelligence/call-ai-suggestion.service";

import type { LiveAssistInput } from "./call-center.types";

export type LiveAssistResult = {
  suggested: string;
  alternatives: string[];
  nextStep: string;
  stage: CallStage;
};

/**
 * Real-time assist for live calls — wraps sales-script suggestions (human speaks; no auto voice).
 */
export function getLiveAssist(input: LiveAssistInput, scriptContext?: ScriptContext): LiveAssistResult {
  const ctx: ScriptContext = {
    audience: input.audience,
    ...scriptContext,
  };

  const r = getIntelSuggestions({
    lastClientSentence: input.lastClientSentence,
    audience: input.audience,
    scriptCategory: input.scriptCategory,
    stage: input.stage,
    discoveryIndex: input.discoveryIndex,
    scriptContext: ctx,
  });

  let nextStep = "Advance only when you’ve delivered the line naturally.";
  if (r.stage === "objection") nextStep = "Acknowledge, ask one clarifying question, then offer proof or a short demo.";
  if (r.stage === "closing") nextStep = "Confirm calendar + who joins — keep it concrete.";
  if (r.stage === "discovery") nextStep = "Listen for pain, then tie one product behavior to it.";

  return {
    suggested: r.suggested,
    alternatives: r.alternatives.filter(Boolean).slice(0, 3),
    nextStep,
    stage: r.stage,
  };
}
