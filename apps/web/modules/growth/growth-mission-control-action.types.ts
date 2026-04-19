/**
 * Mission Control Action Bridge — navigation + context only; no autonomous execution.
 */

export type MissionControlActionSource = "focus" | "checklist" | "risk" | "review" | "note";

export type MissionControlActionKind =
  | "navigate"
  | "open_panel"
  | "open_draft"
  | "review_item"
  | "inspect_risk";

export type MissionControlActionPriority = "high" | "medium" | "low";

/** Canonical routing keys — resolved to URLs in the browser with locale/country. */
export type MissionControlNavTarget =
  | "fusion"
  | "governance"
  | "governance_console"
  | "executive"
  | "simulation"
  | "strategy"
  | "daily_brief"
  | "multi_agent"
  | "learning"
  | "revenue"
  | "broker_closing"
  | "broker_team_admin"
  | "host_bnhub"
  | "cadence"
  | "memory"
  | "graph"
  | "operating_review"
  | "policy_enforcement";

export type MissionControlActionItem = {
  id: string;
  source: MissionControlActionSource;
  title: string;
  description: string;
  /** Stable nav key — client maps to dashboard hash or admin path. */
  navTarget: MissionControlNavTarget;
  actionType: MissionControlActionKind;
  priority: MissionControlActionPriority;
  /** Why this surfaced in Mission Control (deterministic copy). */
  rationale: string;
  /** What to verify on the destination panel. */
  operatorHint: string;
  /** Rough completion signal — advisory. */
  doneHint: string;
  queryParams?: Record<string, string>;
  /** Safe string hints only — never executable payloads. */
  prefillData?: Record<string, string>;
};

export type MissionControlActionBundle = {
  topAction?: MissionControlActionItem;
  actionItems: MissionControlActionItem[];
  generatedAt: string;
};
