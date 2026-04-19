import type { PlatformImprovementOperatorStatus, PlatformImprovementPriorityHistoryEvent } from "./platform-improvement.types";

export type StoredOperatorPriorityRow = {
  status: PlatformImprovementOperatorStatus;
  history: PlatformImprovementPriorityHistoryEvent[];
  createdAt?: string;
  updatedAt?: string;
  acknowledgedAt?: string;
  plannedAt?: string;
  startedAt?: string;
  completedAt?: string;
  dismissedAt?: string;
};

export type PlatformImprovementOperatorStateDocument = {
  version: 1;
  priorities: Record<string, StoredOperatorPriorityRow>;
  updatedAt: string;
};

