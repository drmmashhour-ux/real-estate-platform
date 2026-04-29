/** LECIPM autonomous execution dashboard — enums mirrored from Prisma. */

export type LecipmExecutionTaskType =
  | "MESSAGE"
  | "FOLLOW_UP"
  | "DOCUMENT_PREP"
  | "OFFER_PREP"
  | "PRICE_UPDATE_PREP"
  | "INVESTOR_PACKET_PREP"
  | "NOTARY_REMINDER"
  | "INVOICE_PREP"
  | "DISCLOSURE_PREP"
  | "DEAL_STAGE_PREP";

export type LecipmExecutionEntityType =
  | "LISTING"
  | "DEAL"
  | "CONVERSATION"
  | "PACKET"
  | "INVOICE"
  | "CLOSING";

export type LecipmExecutionTaskStatus =
  | "DRAFT"
  | "QUEUED"
  | "READY_FOR_APPROVAL"
  | "APPROVED"
  | "EXECUTED"
  | "REJECTED"
  | "FAILED";

export type LecipmExecutionRiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type LecipmAutonomousExecutionMode =
  | "OFF"
  | "ASSIST"
  | "SAFE_AUTOMATION"
  | "APPROVAL_REQUIRED";

export type LecipmExecutionTaskView = {
  id: string;
  brokerUserId: string;
  taskType: LecipmExecutionTaskType;
  entityType: LecipmExecutionEntityType;
  entityId: string;
  status: LecipmExecutionTaskStatus;
  riskLevel: LecipmExecutionRiskLevel;
  priorityScore?: number;
  payloadJson?: unknown;
  aiReasoningJson?: unknown;
  idempotencyKey?: string | null;
  linkedBrokerApprovalId?: string | null;
  linkedActionPipelineId?: string | null;
  failureCount?: number;
  lastError?: string | null;
  safetyPausedAt?: Date | string | null;
  outcomeLabel?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};
