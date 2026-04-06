export const HIRING_ROLES = ["sales", "operations", "growth"] as const;
export type HiringRole = (typeof HIRING_ROLES)[number];

export const HIRING_STAGES = [
  "applied",
  "screening",
  "interview",
  "trial",
  "hired",
  "rejected",
] as const;
export type HiringStage = (typeof HIRING_STAGES)[number];

export const INTERACTION_TYPES = ["message", "call", "interview"] as const;

export const TRIAL_TASK_KEYS = ["contact_leads", "close_one_user"] as const;
export type TrialTaskKey = (typeof TRIAL_TASK_KEYS)[number];

export const PERFORMANCE_FLAGS = ["high_performer", "low_performer", "needs_review"] as const;
export type PerformanceFlag = (typeof PERFORMANCE_FLAGS)[number];

export function isHiringRole(s: string): s is HiringRole {
  return (HIRING_ROLES as readonly string[]).includes(s);
}

export function isHiringStage(s: string): s is HiringStage {
  return (HIRING_STAGES as readonly string[]).includes(s);
}
