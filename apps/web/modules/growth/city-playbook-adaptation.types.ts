/**
 * City playbook adaptation — internal guided replication intelligence only.
 * Not causal proof; does not execute outreach or payments.
 */

export type CityPlaybookSignal = {
  city: string;
  strengths: string[];
  weaknesses: string[];
  confidence: "low" | "medium" | "high";
};

export type CityPlaybookTemplate = {
  sourceCity: string;
  /** Human-readable patterns observed in logged metrics (not guarantees). */
  keyPatterns: string[];
  /** Numeric baselines for gap math — omitted when absent in source data. */
  baselineRates: {
    captureRate?: number;
    playbookCompletionRate?: number;
    progressionRate?: number;
    avgCompletionTimeHours?: number;
  };
  confidence: "low" | "medium" | "high";
  sampleSize: number;
};

export type CityPlaybookAdaptation = {
  targetCity: string;
  sourceCity: string;
  recommendedAdjustments: string[];
  rationale: string;
  confidence: "low" | "medium" | "high";
  constraints: string[];
  warnings: string[];
};

export type CityPlaybookAdaptationBundle = {
  topCity: {
    city: string;
    signal: CityPlaybookSignal;
    template: CityPlaybookTemplate;
  } | null;
  /** Cities receiving adaptations (excludes reference city). */
  targetCities: string[];
  adaptations: CityPlaybookAdaptation[];
  insights: string[];
  generatedAt: string;
  /** Cities skipped from gap/adaptation with reasons (thin data, etc.). */
  skippedTargets: { city: string; reason: string }[];
};
