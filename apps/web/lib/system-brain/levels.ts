import type { AutonomyMode } from "./autonomy-modes";

/**
 * Autonomy maturity model (documentation + runtime hints).
 *
 * - L2 ASSIST → `ASSIST`
 * - L3 SAFE_AUTOPILOT → `SAFE_AUTOPILOT` (low-risk auto via rule engine + guardrails)
 * - L4 CONTROLLED → `FULL_WITH_APPROVAL` (medium actions enqueue `MarketplaceAutonomyApproval`)
 * - L5 FULL w/ guardrails → same mode; **forbidden primitives** still blocked in `safety-guardrails.ts`
 */
export type AutonomyLevel = 2 | 3 | 4 | 5;

export function autonomyModeForLevel(level: AutonomyLevel): AutonomyMode {
  switch (level) {
    case 2:
      return "ASSIST";
    case 3:
      return "SAFE_AUTOPILOT";
    case 4:
    case 5:
      return "FULL_WITH_APPROVAL";
    default:
      return "ASSIST";
  }
}

export function describeAutonomyLevel(level: AutonomyLevel): string {
  switch (level) {
    case 2:
      return "Assisted intelligence — suggestions only; human decides.";
    case 3:
      return "Safe autopilot — low-risk listing/SEO/internal flags may auto-run under rules.";
    case 4:
      return "Controlled autonomy — medium-risk changes require approval queue.";
    case 5:
      return "Full marketplace autonomy with hard guardrails — never auto money/disputes/legal.";
    default:
      return "";
  }
}
