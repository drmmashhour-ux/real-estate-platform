/**
 * Growth operating cadence — advisory rhythm only; no execution.
 */

export type GrowthCadenceStatus = "weak" | "watch" | "healthy" | "strong";

export type GrowthDailyChecklistSource = "executive" | "strategy" | "agents" | "leads" | "governance";

export type GrowthDailyCadence = {
  date: string;
  status: GrowthCadenceStatus;
  focus?: string;
  checklist: {
    id: string;
    title: string;
    source: GrowthDailyChecklistSource;
    priority: "low" | "medium" | "high";
  }[];
  risks: string[];
  notes: string[];
  createdAt: string;
};

export type GrowthWeeklyCadence = {
  weekStart: string;
  strategyFocus?: string;
  priorities: string[];
  experiments: string[];
  roadmapFocus: string[];
  warnings: string[];
  createdAt: string;
};

export type GrowthCadenceBundle = {
  daily: GrowthDailyCadence;
  weekly: GrowthWeeklyCadence;
  createdAt: string;
};
