import type { SalesCallOutcome } from "@/modules/sales-scripts/sales-script.types";

import type { CallSessionSnapshot } from "./call-assistant.types";

/** Embedded in call-log notes for offline analysis / future weight tuning. */
const META_PREFIX = "__call_assistant_v1__";

export type LearningBlob = Pick<
  CallSessionSnapshot,
  "stagesVisited" | "secondsInCallApprox" | "objectionLabels" | "suggestionMeta"
> & {
  outcome: SalesCallOutcome;
};

export function serializeLearningFooter(blob: LearningBlob): string {
  return `${META_PREFIX}${JSON.stringify(blob)}`;
}

export function buildCallAssistantNotes(userNotes: string, blob: LearningBlob): string {
  const core = userNotes.trim();
  const footer = serializeLearningFooter(blob);
  return core ? `${core}\n\n${footer}` : footer;
}
