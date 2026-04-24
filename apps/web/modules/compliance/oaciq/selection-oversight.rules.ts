import type { ComplianceCaseContext, ComplianceRule, ComplianceRuleResult } from "@/modules/compliance/core/rule-types";

function metaBool(ctx: ComplianceCaseContext, key: string): boolean {
  return ctx.metadata?.[key] === true;
}

function r(
  id: string,
  passed: boolean,
  severity: ComplianceRuleResult["severity"],
  code: string,
  title: string,
  message: string,
  blocking?: boolean,
  requiredActions?: string[],
): ComplianceRuleResult {
  return {
    ruleId: id,
    passed,
    severity,
    code,
    title,
    message,
    blocking,
    requiredActions,
  };
}

export const selectionOversightRules: ComplianceRule[] = [
  {
    id: "selection_competence_verified",
    category: "selection",
    evaluate(ctx) {
      if (!metaBool(ctx, "selectionReviewRequired")) return null;
      const ok = metaBool(ctx, "selectionCompetenceVerified");
      return r(
        "selection_competence_verified",
        ok,
        ok ? "low" : "high",
        "SELECTION_COMPETENCE",
        "Licensee competence review",
        ok
          ? "Competence factors documented for licensee/employee selection."
          : "Selection must document competence and suitability before assignment.",
        !ok,
        ok ? undefined : ["Complete competence checklist", "Record reviewer sign-off"],
      );
    },
  },
  {
    id: "selection_integrity_checked",
    category: "selection",
    evaluate(ctx) {
      if (!metaBool(ctx, "selectionReviewRequired")) return null;
      const ok = metaBool(ctx, "selectionIntegrityChecked");
      return r(
        "selection_integrity_checked",
        ok,
        ok ? "low" : "high",
        "SELECTION_INTEGRITY",
        "Integrity / references",
        ok
          ? "Integrity and reference checks recorded where required."
          : "Integrity, references, and prior termination context must be reviewed.",
        !ok,
      );
    },
  },
  {
    id: "selection_references_checked",
    category: "selection",
    evaluate(ctx) {
      if (!metaBool(ctx, "selectionReviewRequired")) return null;
      const ok = metaBool(ctx, "selectionReferencesChecked");
      return r(
        "selection_references_checked",
        ok,
        ok ? "low" : "medium",
        "SELECTION_REFERENCES",
        "Professional references",
        ok ? "References verified or waiver documented." : "Obtain or document references for new licensees/employees.",
        false,
      );
    },
  },
  {
    id: "training_plan_present",
    category: "selection",
    evaluate(ctx) {
      if (!metaBool(ctx, "agencyHasTrainingObligation")) return null;
      const ok = metaBool(ctx, "trainingPlanPresent");
      return r(
        "training_plan_present",
        ok,
        ok ? "low" : "medium",
        "TRAINING_PLAN",
        "Coaching / mentoring plan",
        ok ? "Training or mentoring plan is on file." : "Document onboarding, coaching, or mentoring obligations.",
        false,
      );
    },
  },
  {
    id: "annual_feedback_required",
    category: "selection",
    evaluate(ctx) {
      if (!metaBool(ctx, "annualPerformanceReviewDue")) return null;
      const ok = metaBool(ctx, "annualFeedbackCompleted");
      return r(
        "annual_feedback_required",
        ok,
        ok ? "low" : "medium",
        "ANNUAL_FEEDBACK",
        "Annual performance review",
        ok ? "Annual feedback cycle completed." : "Complete documented annual feedback for supervised staff.",
        false,
      );
    },
  },
  {
    id: "supervision_procedure_defined",
    category: "supervision",
    evaluate(ctx) {
      const solo = metaBool(ctx, "soloBroker");
      const needs = metaBool(ctx, "agencyOperation") || solo;
      if (!needs) return null;
      const ok = solo ? metaBool(ctx, "soloSelfGovernanceProcedure") : metaBool(ctx, "supervisionProcedureDefined");
      return r(
        "supervision_procedure_defined",
        ok,
        ok ? "low" : "high",
        "SUPERVISION_PROCEDURE",
        solo ? "Solo broker self-governance" : "Executive supervision",
        solo
          ? ok
            ? "Solo broker documents internal compliance accountability."
            : "Solo brokers must maintain written self-governance / supervision-equivalent controls."
          : ok
            ? "Supervision procedure defined."
            : "Define supervision principles, review cadence, and escalation.",
        !ok,
      );
    },
  },
];
