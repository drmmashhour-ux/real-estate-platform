import { shouldRecommendEscalation } from "@/src/modules/autonomous-workflow-assistant/policies/escalationThresholdPolicy";

export function buildEscalationRecommendations(args: {
  blockingIssues: string[];
  contradictions: string[];
  criticalOpen: number;
}) {
  if (!shouldRecommendEscalation({ blockingIssueCount: args.blockingIssues.length, contradictionCount: args.contradictions.length, criticalGraphIssues: args.criticalOpen }))
    return [] as string[];
  return [
    "Escalation recommended: multiple blockers or critical graph issues present.",
    "Assign a senior reviewer before proceeding to signature.",
  ];
}
