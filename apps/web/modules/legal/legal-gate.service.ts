import { LEGAL_ENFORCEMENT_RULES } from "./legal-enforcement-rules";
import type {
  LegalEnforcementMode,
  LegalGateAction,
  LegalGateContext,
  LegalGateResult,
} from "./legal-readiness.types";

/**
 * Actions where any **critical** Legal Hub risk row blocks the operation (deterministic).
 * Does not replace requirement rules — adds an additional hard layer for high-risk surfaces.
 */
const CRITICAL_RISK_HARD_ACTIONS: ReadonlySet<LegalGateAction> = new Set([
  "publish_listing",
  "activate_host_listing",
  "submit_offer",
  "become_broker",
]);

function requirementSatisfiedForGate(state: string | undefined): boolean {
  const s = state ?? "not_started";
  return s === "approved" || s === "waived" || s === "submitted";
}

/**
 * Pure gate evaluation — no I/O. Safe on partial context (missing workflows → treated as incomplete).
 */
export function evaluateLegalGate(action: LegalGateAction, context: LegalGateContext): LegalGateResult {
  try {
    const reasons: string[] = [];
    const blockingRequirements: string[] = [];
    let hardHit = false;
    let softHit = false;

    const rows = LEGAL_ENFORCEMENT_RULES[action] ?? [];

    for (const row of rows) {
      if (!row.actors.includes(context.actorType)) continue;

      const wf = context.workflows.find((w) => w.workflowType === row.workflowType);
      const block = wf?.requirements.find((r) => r.definition.id === row.requirementId);
      const state = block?.state ?? "not_started";
      const ok = requirementSatisfiedForGate(state);
      if (ok) continue;

      const label = block?.definition.label ?? row.requirementId;
      const key = `${row.workflowType}:${row.requirementId}`;
      const human = `Checklist item not satisfied: ${label} (${row.workflowType}).`;

      if (row.mode === "hard") {
        hardHit = true;
        blockingRequirements.push(key);
        reasons.push(human);
      } else {
        softHit = true;
        reasons.push(`Advisory — ${human}`);
      }
    }

    if (CRITICAL_RISK_HARD_ACTIONS.has(action)) {
      for (const r of context.risks) {
        if (r.severity !== "critical") continue;
        hardHit = true;
        blockingRequirements.push(`risk:${r.id}`);
        reasons.push(`Open compliance signal (informational flag): ${r.title}`);
      }
    }

    const allowed = !hardHit;
    let mode: LegalEnforcementMode = "none";
    if (hardHit) mode = "hard";
    else if (softHit) mode = "soft";

    return { allowed, mode, reasons, blockingRequirements };
  } catch {
    return {
      allowed: true,
      mode: "none",
      reasons: ["Compliance check could not be evaluated; proceeding without additional blocks."],
      blockingRequirements: [],
    };
  }
}
