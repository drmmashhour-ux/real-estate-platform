import type { FounderActionStatus } from "@prisma/client";

export type FounderActionSourceType =
  | "insight"
  | "briefing"
  | "copilot"
  | "manual";

export type CreateFounderActionInput = {
  sourceType: FounderActionSourceType;
  sourceId?: string;
  title: string;
  summary: string;
  priority?: string;
};

export type PatchFounderActionInput = {
  status?: FounderActionStatus;
  assignedToUserId?: string | null;
  priority?: string;
};
