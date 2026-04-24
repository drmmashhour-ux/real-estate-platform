import type {
  LecipmAutonomousExecutionMode,
  LecipmExecutionEntityType,
  LecipmExecutionRiskLevel,
  LecipmExecutionTaskType,
} from "@prisma/client";

export type QueueExecutionTaskInput = {
  brokerUserId: string;
  taskType: LecipmExecutionTaskType;
  entityType: LecipmExecutionEntityType;
  entityId: string;
  payloadJson: Record<string, unknown>;
  aiReasoningJson: Record<string, unknown>;
  /** When set, overrides classifier default for this row. */
  riskLevel?: LecipmExecutionRiskLevel;
  priorityScore?: number;
  idempotencyKey?: string;
  skipAutoRun?: boolean;
};

export type ExecutionAuditEvent =
  | "task_created"
  | "task_queued"
  | "task_auto_executed"
  | "task_executed"
  | "task_sent_for_approval"
  | "task_approved"
  | "task_rejected"
  | "task_failed"
  | "task_retried";

export type BrokerExecutionSettingsView = {
  mode: LecipmAutonomousExecutionMode;
  autoPausedUntil: string | null;
};
