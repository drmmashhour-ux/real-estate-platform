import { buildEscalationRecommendations } from "@/src/modules/autonomous-workflow-assistant/infrastructure/workflowEscalationService";

export function generateEscalationRecommendations(args: {
  blockingIssues: string[];
  contradictions: string[];
  criticalOpen: number;
}) {
  return buildEscalationRecommendations(args);
}
