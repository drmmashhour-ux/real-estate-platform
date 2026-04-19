/**
 * Internal execution accountability — visibility only; no automation or outbound effects.
 */

export type ExecutionSurfaceType = "daily_routine" | "pitch_script" | "city_domination_mtl";

export type ExecutionChecklistEntry = {
  id: string;
  surfaceType: ExecutionSurfaceType;
  itemId: string;
  dayNumber?: number;
  weekNumber?: number;
  userId?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
};

export type ExecutionAccountabilitySurfaceBreakdown = {
  surfaceType: ExecutionSurfaceType;
  /** Denominator for completion rate (template slots or usage events depending on surface). */
  totalItems: number;
  completedItems: number;
  skippedItems: number;
  completionRate: number;
};

export type ExecutionAccountabilityUserBreakdown = {
  userId: string;
  totalExpected: number;
  completedItems: number;
  skippedItems: number;
  completionRate: number;
  /** Deterministic: ≥50% checklist completion across daily+MTL template slots. */
  onTrack: boolean;
};

export type ExecutionAccountabilitySummary = {
  totalItems: number;
  completedItems: number;
  skippedItems: number;
  /** Weighted aggregate for checklist surfaces; pitch usage contributes separately in bySurface. */
  completionRate: number;
  bySurface: ExecutionAccountabilitySurfaceBreakdown[];
  byUser: ExecutionAccountabilityUserBreakdown[];
  generatedAt: string;
  /** True when cross-user comparison would be misleading (see docs). */
  lowData: boolean;
};

export type ExecutionAccountabilityInsightSeverity = "info" | "warning" | "attention";

export type ExecutionAccountabilityInsight = {
  type: string;
  label: string;
  description: string;
  severity: ExecutionAccountabilityInsightSeverity;
  suggestedAction: string;
};
