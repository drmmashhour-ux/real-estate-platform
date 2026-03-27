/** Stored in task payload for safe auto-complete when blockers clear (no legal fact mutation). */
export type TaskResolutionCheck =
  | { kind: "missing_fields"; keys: string[] }
  | { kind: "graph_blockers"; messages: string[] }
  | { kind: "contradictions"; flags: string[] }
  | { kind: "knowledge_blocks"; messages: string[] };

export type AutonomousTaskOutput = {
  taskType: string;
  priority: "low" | "medium" | "high" | "critical";
  targetUserRole: "seller" | "broker" | "admin" | "reviewer";
  summary: string;
  recommendedAction: string;
  blockedBy?: string[];
  confidence: number;
  requiresApproval: boolean;
  /** Traceability: field keys, graph issue titles, or doc refs (reviewable; not auto-mutated). */
  sourceRefs?: string[];
  /** Short factual line: why this task exists. */
  why?: string;
  /** What triggered generation (e.g. validation run, graph rebuild). */
  triggerLabel?: string;
  /** Auto-complete when these blockers are cleared in a later snapshot. */
  resolutionCheck?: TaskResolutionCheck;
};
