/** Admin AI insight center — enums + slim row types (mirror Prisma, no `@prisma/client`). */

export type AdminAiInsightType =
  | "daily_summary"
  | "alert"
  | "recommendation"
  | "listing_diagnosis"
  | "revenue_summary"
  | "user_intent_summary";

export type AdminAiInsightPriority = "low" | "medium" | "high" | "critical";

export type AdminAiEntityType = "listing" | "user" | "revenue" | "document_request" | "payment" | "support" | "funnel";

export type AdminAiRunStatus = "queued" | "running" | "completed" | "failed";

export type AdminAiInsightView = {
  id: string;
  type: AdminAiInsightType;
  title: string;
  body: string;
  priority: AdminAiInsightPriority;
  entityType?: AdminAiEntityType | null;
  entityId?: string | null;
  metadataJson?: unknown;
  createdAt?: Date | string;
};

export type AdminAiRunView = {
  id: string;
  runType: string;
  status: AdminAiRunStatus;
  startedAt?: Date | string | null;
  completedAt?: Date | string | null;
  summary?: string | null;
  createdAt?: Date | string;
};
