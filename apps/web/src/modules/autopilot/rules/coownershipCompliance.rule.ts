import type { LecipmCoreAutopilotExecutionMode } from "@/src/modules/autopilot/types";
import { complianceFlags } from "@/config/feature-flags";
import { COOWNERSHIP_CHECKLIST_DEFINITIONS } from "@/services/compliance/coownershipCompliance.service";

/** All CRM merged checklist keys — mirrored from merged definitions. */
export const COOWNERSHIP_AUTOPILOT_CHECKLIST_KEYS = COOWNERSHIP_CHECKLIST_DEFINITIONS.map((d) => d.key);

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
 */
export function evaluateCoownershipComplianceRule(input: {
  listing: CoownershipRuleListingInput;
  mode: LecipmCoreAutopilotExecutionMode;
  /** Certificate received row (`coownership_certificate_received`) */
  certificateComplete: boolean;
  insuranceGateComplete: boolean;
  /** CRITICAL merged compliance block keys */
  criticalComplianceComplete: boolean;
}): CoownershipComplianceAutopilotDecision | null {
  const { listing, mode, certificateComplete, insuranceGateComplete, criticalComplianceComplete } = input;

  if (mode === "OFF") return null;
  if (!listingMatchesCoownershipRule(listing)) return null;

  const insuranceGateEnforced = complianceFlags.coownershipInsuranceEnforcement === true;
  const complianceCriticalEnforced = complianceFlags.coownershipComplianceEnforcement === true;

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
            "Request the certificate from the syndicate immediately; verify mandatory syndicate property insurance and third-party liability; where gaps exist advise a conditional clause in the promise to purchase — platform guidance only.",
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
    if (complianceCriticalEnforced && !criticalComplianceComplete) {
      return {
        domain: "COOWNERSHIP_COMPLIANCE",
        severity: "critical",
        actions: [
          ...baseChecklist.actions,
          {
            type: "BLOCK_ACTION",
            payload: {
              reason:
                "Critical co-ownership compliance items are missing — certificate flow and syndicate insurance verification required.",
            },
          },
        ],
      };
    }
    if (!certificateComplete) {
      return {
        domain: "COOWNERSHIP_COMPLIANCE",
        severity: "critical",
        actions: [
          ...baseChecklist.actions,
          {
            type: "BLOCK_ACTION",
            payload: {
              reason:
                "Certificate of co-ownership condition not verified as received — complete checklist before proceeding.",
            },
          },
        ],
      };
    }
    if (insuranceGateEnforced && !insuranceGateComplete) {
      return {
        domain: "COOWNERSHIP_COMPLIANCE",
        severity: "critical",
        actions: [
          ...baseChecklist.actions,
          {
            type: "BLOCK_ACTION",
            payload: {
              reason:
                "Mandatory insurance verification incomplete — syndicate building coverage, syndicate liability, and co-owner liability minimum must be confirmed.",
            },
          },
        ],
      };
    }
    return baseChecklist;
  }

  return baseChecklist;
}
