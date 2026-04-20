import type { LecipmCoreAutopilotExecutionMode } from "@/src/modules/autopilot/types";

/** Québec Reg. 2025 — checklist keys mirrored in `coownershipCompliance.service`. */
export const COOWNERSHIP_AUTOPILOT_CHECKLIST_KEYS = [
  "coownership_certificate",
  "certificate_reviewed",
  "maintenance_log",
  "contingency_fund",
  "seller_informed",
] as const;

export type CoownershipComplianceActionPayload =
  | {
      type: "CHECKLIST_ENSURE";
      payload: { checklist: readonly string[] };
    }
  | {
      type: "RECOMMENDATION";
      payload: { message: string };
    }
  | {
      type: "BLOCK_ACTION";
      payload: { reason: string };
    };

export type CoownershipComplianceAutopilotDecision = {
  domain: "COOWNERSHIP_COMPLIANCE";
  severity: "warning" | "critical";
  actions: CoownershipComplianceActionPayload[];
};

export type CoownershipRuleListingInput = {
  listingType: string;
  isCoOwnership: boolean;
};

export function listingMatchesCoownershipRule(input: CoownershipRuleListingInput): boolean {
  return input.listingType === "CONDO" || input.isCoOwnership === true;
}

/**
 * Deterministic decision: at most one compliance bundle per evaluation.
 * Modes shape which actions are emitted (executor still enforces side effects).
 */
export function evaluateCoownershipComplianceRule(input: {
  listing: CoownershipRuleListingInput;
  mode: LecipmCoreAutopilotExecutionMode;
  /** From CRM checklist — coownership_certificate row */
  certificateComplete: boolean;
}): CoownershipComplianceAutopilotDecision | null {
  const { listing, mode, certificateComplete } = input;

  if (mode === "OFF") return null;
  if (!listingMatchesCoownershipRule(listing)) return null;

  const baseChecklist: CoownershipComplianceAutopilotDecision = {
    domain: "COOWNERSHIP_COMPLIANCE",
    severity: "warning",
    actions: [
      {
        type: "CHECKLIST_ENSURE",
        payload: { checklist: [...COOWNERSHIP_AUTOPILOT_CHECKLIST_KEYS] },
      },
      {
        type: "RECOMMENDATION",
        payload: {
          message:
            "Request the co-ownership certificate immediately to avoid delays and ensure compliance.",
        },
      },
    ],
  };

  if (mode === "ASSIST") {
    return {
      ...baseChecklist,
      actions: baseChecklist.actions.filter((a) => a.type === "RECOMMENDATION"),
    };
  }

  if (mode === "SAFE_AUTOPILOT") {
    return baseChecklist;
  }

  if (mode === "FULL_AUTOPILOT_APPROVAL") {
    if (!certificateComplete) {
      return {
        domain: "COOWNERSHIP_COMPLIANCE",
        severity: "critical",
        actions: [
          ...baseChecklist.actions,
          {
            type: "BLOCK_ACTION",
            payload: { reason: "Missing co-ownership certificate" },
          },
        ],
      };
    }
    return baseChecklist;
  }

  return baseChecklist;
}
