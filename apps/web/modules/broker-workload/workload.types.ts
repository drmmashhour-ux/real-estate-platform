export type WorkloadInsight = {
  type: "overload" | "unassigned" | "stuck" | "coordination" | "review";
  title: string;
  summary: string;
  priority: "low" | "medium" | "high";
  reasons: string[];
  recommendedAction: string;
  dealId?: string;
  leadId?: string;
};

export type RebalanceSuggestion = WorkloadInsight & {
  suggestedAssigneeUserId?: string;
};
