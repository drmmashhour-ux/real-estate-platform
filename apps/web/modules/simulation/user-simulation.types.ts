/**
 * LECIPM Real User Simulation v1 — types for personas, journeys, friction, and outcomes.
 * Narratives are deterministic; metrics from DB are optional and labeled when used.
 */

export type SimulationPersona =
  | "curious_guest"
  | "price_sensitive_guest"
  | "first_time_host"
  | "experienced_host"
  | "new_broker"
  | "busy_broker_mobile"
  | "admin_reviewer"
  | "confused_user";

export type ConversionStatus = "converted" | "abandoned" | "blocked" | "partial" | "unknown";

export type FrictionSeverity = "low" | "medium" | "high";

export type SimulationStep = {
  id: string;
  at: string;
  /** What the user did (narrative). */
  action: string;
  /** Optional screen or route label. */
  surface?: string;
  /** Simulated hesitation (ms) — not wall-clock unless running timed E2E. */
  hesitationMs?: number;
  /** User intent / emotion for logging. */
  mood?: "curious" | "impatient" | "skeptical" | "distracted" | "confused" | "rushed" | "neutral";
  /** Mistake or retry. */
  mistake?: boolean;
  /** Abandoned after this step (drop-off anchor). */
  abandonedHere?: boolean;
  meta?: Record<string, unknown>;
};

export type FrictionPoint = {
  id: string;
  category:
    | "pricing_clarity"
    | "trust_signals"
    | "performance"
    | "listing_clarity"
    | "checkout"
    | "hidden_fees"
    | "onboarding"
    | "guidance"
    | "workflow"
    | "mobile_ux"
    | "admin_visibility"
    | "errors_validation"
    | "navigation"
    | "decision_paralysis"
    | "value_perception";
  severity: FrictionSeverity;
  stepId?: string;
  description: string;
  /** Evidence — narrative or metric key; never fake numbers. */
  evidence: string;
};

export type DropOffPoint = {
  stepId: string;
  label: string;
  reason: "hesitation" | "confusion" | "price" | "trust" | "time" | "error" | "distraction" | "unknown";
  detail: string;
};

export type ConfusionEvent = {
  at: string;
  stepId: string;
  description: string;
};

export type PersonaJourneyResult = {
  persona: SimulationPersona;
  journey: string;
  steps: SimulationStep[];
  frictionPoints: FrictionPoint[];
  dropOffPoints: DropOffPoint[];
  confusionEvents: ConfusionEvent[];
  conversionStatus: ConversionStatus;
  recommendations: string[];
  logs: string[];
};

export type UserSimulationReport = {
  generatedAt: string;
  engineVersion: "lecipm_user_simulation_v1";
  personasTested: SimulationPersona[];
  journeys: PersonaJourneyResult[];
  /** Aggregate friction (deduped by id). */
  allFrictionPoints: FrictionPoint[];
  allDropOffs: DropOffPoint[];
  conversionBlockers: string[];
  recommendations: string[];
  /** 0–100: lower when more high-severity friction; heuristic, not a promise of revenue. */
  overallReadinessScore: number;
  notes: string[];
};
