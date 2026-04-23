import { getNextLine } from "@/modules/call-assistant/call-assistant.service";
import type { NextLineResult } from "@/modules/call-assistant/call-assistant.types";

import type { CallIntelSuggestionInput } from "./call-intelligence.types";

/**
 * Reply suggestions — uses the approved sales-script engine (deterministic lines + objection library).
 * Human speaks; this never triggers outbound speech or dialing.
 */
export function getIntelSuggestions(input: CallIntelSuggestionInput): NextLineResult {
  const last = input.lastClientSentence.trim();
  return getNextLine({
    audience: input.audience,
    scriptCategory: input.scriptCategory,
    stage: input.stage,
    discoveryIndex: input.discoveryIndex,
    lastProspectInput: last.length > 0 ? last : undefined,
    scriptContext: input.scriptContext,
  });
}
