/**
 * Controlled execution phase — builds Operator V2 execution plans only (no payments, no ad sync, no Stripe bypass).
 */
import { autonomousCompanyFlags, getAutonomousCompanyModeTier } from "@/config/feature-flags";
import { buildExecutionPlan } from "@/modules/operator/operator-execution-planner.service";
import type { CompanyExecutionResult } from "./autonomous-company.types";
import { AUTONOMOUS_COMPANY_MAX_ACTIONS_PER_CYCLE } from "./autonomous-company.safety";

export async function runCompanyExecutionPhase(opts: {
  environment: "development" | "staging" | "production";
}): Promise<CompanyExecutionResult | null> {
  const mode = getAutonomousCompanyModeTier();
  if (!autonomousCompanyFlags.autonomousExecutionV1) {
    return {
      mode,
      plan: null,
      notes: ["FEATURE_AUTONOMOUS_EXECUTION_V1 is off — no Operator plan built."],
    };
  }

  if (mode === "off") {
    return { mode, plan: null, notes: ["AUTONOMOUS_COMPANY_MODE is off — execution phase skipped."] };
  }

  const { listRecommendations } = await import("@/modules/operator/operator.repository");
  const recommendations = await listRecommendations(40);
  const plan = await buildExecutionPlan({
    recommendations,
    environment: opts.environment,
    maxBatch: AUTONOMOUS_COMPANY_MAX_ACTIONS_PER_CYCLE,
    resolveConflicts: true,
  });

  const tierNote =
    mode === "shadow"
      ? "Shadow: plan for observation only."
      : mode === "assist"
        ? "Assist: plan for human review — no autonomous side effects from this module."
        : "Safe autopilot tier: plan only — external execution remains gated elsewhere.";

  return {
    mode,
    plan,
    notes: [tierNote, "No destructive changes; guardrails enforced in Operator planner."],
  };
}
