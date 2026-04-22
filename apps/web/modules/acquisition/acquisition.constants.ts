import type { AcquisitionPipelineStage, AcquisitionRelationshipStatus } from "./acquisition.types";

/** Ordered outreach stages — `moveToNextStage` advances along this list (stops before LOST). */
export const PIPELINE_ORDER: AcquisitionPipelineStage[] = [
  "NEW",
  "CONTACTED",
  "FOLLOW_UP",
  "DEMO_SCHEDULED",
  "CONVERTED",
];

/** Kanban columns including terminal LOST */
export const KANBAN_COLUMNS: AcquisitionPipelineStage[] = [...PIPELINE_ORDER, "LOST"];

export function syncRelationshipFromPipeline(stage: AcquisitionPipelineStage): AcquisitionRelationshipStatus {
  switch (stage) {
    case "NEW":
      return "CONTACTED";
    case "CONTACTED":
      return "CONTACTED";
    case "FOLLOW_UP":
      return "INTERESTED";
    case "DEMO_SCHEDULED":
      return "INTERESTED";
    case "CONVERTED":
      return "ONBOARDED";
    case "LOST":
      return "LOST";
    default:
      return "CONTACTED";
  }
}
