import type { RoiComparisonResult } from "./roi-calculator.types";
import { formatRoiSummaryMarkdown } from "./roi-calculator.explainer";
import { ROI_DISCLAIMERS } from "./confidence.service";

export function explainHostRoiMarkdown(result: RoiComparisonResult): string {
  return formatRoiSummaryMarkdown(result);
}

export function listHostRoiDisclaimers(): string[] {
  return Object.values(ROI_DISCLAIMERS);
}
