import { greenAiLog } from "./green-ai-logger";

const DISCLOSURE =
  "Québec-inspired green score is a non-official, modeled signal for discovery only. It is not a government or EnerGuide rating. Verify details independently.";

export const GREEN_SEARCH_PUBLIC_DISCLAIMER = DISCLOSURE;

export function logGreenEvent(
  name:
    | "green_search_decoration_applied"
    | "green_search_filters_applied"
    | "green_ranking_applied"
    | "green_snapshot_used"
    | "green_snapshot_missing",
  payload: Record<string, unknown> = {}
) {
  try {
    greenAiLog.info(name, payload);
  } catch {
    // never throw
  }
}

export function publicDisclaimerLine(): string {
  return DISCLOSURE;
}
