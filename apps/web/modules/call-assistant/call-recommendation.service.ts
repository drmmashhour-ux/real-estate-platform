import type { CallAssistantContext, NextLineResult } from "./call-assistant.types";
import { getNextLine } from "./call-assistant.service";

/**
 * Human-in-the-loop recommendations — same engine as {@link getNextLine}, kept as a dedicated surface for tuning / A-B logic later.
 */
export function getRecommendation(ctx: CallAssistantContext): NextLineResult {
  return getNextLine(ctx);
}
