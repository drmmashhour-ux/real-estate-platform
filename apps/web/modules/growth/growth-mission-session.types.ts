/**
 * Mission Control session mode — guided execution checklist only (no autopilot).
 */

import type { MissionControlNavTarget } from "@/modules/growth/growth-mission-control-action.types";

export type MissionSessionStatus = "active" | "completed" | "abandoned";

export type MissionSessionStepType = "top_action" | "checklist" | "risk_review" | "navigation";

export type MissionSessionStepActionKind = "navigate" | "open_panel" | "inspect" | "mark_done";

export type MissionSessionStep = {
  id: string;
  type: MissionSessionStepType;
  title: string;
  description: string;
  targetSurface?: MissionControlNavTarget | string;
  actionType: MissionSessionStepActionKind;
  completed: boolean;
};

export type MissionSession = {
  id: string;
  startedAt: string;
  endedAt?: string;
  status: MissionSessionStatus;
  topActionTitle?: string;
  checklistItems: string[];
  completedItemIds: string[];
  notes?: string;
  startedBy?: string;
  steps: MissionSessionStep[];
};

export type MissionSessionSummary = {
  sessionId: string;
  topActionTitle?: string;
  totalSteps: number;
  completedSteps: number;
  remainingSteps: number;
  status: MissionSessionStatus;
};
