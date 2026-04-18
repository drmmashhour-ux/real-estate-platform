export type ResidentialPriorityItem = {
  id: string;
  rank: number;
  kind:
    | "deal_attention"
    | "document_review"
    | "copilot_pending"
    | "deadline"
    | "lead_followup"
    | "checklist";
  title: string;
  summary: string;
  severity: "info" | "warning" | "critical";
  dealId?: string;
  href?: string;
};

export type ResidentialKpiSnapshot = {
  activeDeals: number;
  dealsAwaitingReview: number;
  documentsDraft: number;
  documentsBrokerReview: number;
  urgentDeadlines: number;
  highPriorityLeads: number;
  pendingClientFollowups: number;
  copilotPending: number;
};

export type ResidentialDashboardPayload = {
  kpis: ResidentialKpiSnapshot;
  priorities: ResidentialPriorityItem[];
  generatedAt: string;
  disclaimer: string;
};
