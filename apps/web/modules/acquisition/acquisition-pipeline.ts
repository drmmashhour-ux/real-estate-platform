import { PIPELINE_ORDER } from "./acquisition.constants";
import type { AcquisitionPipelineStage } from "./acquisition.types";

export function nextPipelineStage(current: AcquisitionPipelineStage): AcquisitionPipelineStage | null {
  if (current === "LOST") return null;
  const idx = PIPELINE_ORDER.indexOf(current);
  if (idx === -1) return null;
  if (idx >= PIPELINE_ORDER.length - 1) return null;
  return PIPELINE_ORDER[idx + 1] ?? null;
}

export function isTerminalStage(stage: AcquisitionPipelineStage): boolean {
  return stage === "CONVERTED" || stage === "LOST";
}
