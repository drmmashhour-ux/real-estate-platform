import type { SelectionOutput } from "@/src/modules/ai-selection-engine/domain/selection.types";

export function buildSelectionExplanation(selection: SelectionOutput) {
  return {
    shortReason: selection.reasons.slice(0, 2).join(". "),
    keyFactors: selection.reasons,
    actionExplanation: `Recommended action: ${selection.recommendedAction.replace(/_/g, " ")}.`,
  };
}
