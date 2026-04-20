import { describe, expect, it, vi } from "vitest";
import { evaluateLegalCompliancePolicyOnly } from "../policy/policy-engine";
import type { PolicyContext } from "../policy/policy-context";
import { legalHubComplianceRuleCode } from "../policy/rules/legal.rules";
import type { LegalHubSummary } from "@/modules/legal/legal.types";
import type { ObservationSnapshot } from "../types/domain.types";

vi.mock("@/config/feature-flags", () => ({
  legalHubFlags: {
    legalHubV1: true,
    legalReadinessV1: true,
    legalEnforcementV1: true,
  },
}));

vi.mock("@/modules/legal/legal-enforcement", () => ({
  legalEnforcementDisabled: () => false,
}));

/** Minimal LegalHubSummary slice for gate inputs */
function mkSummary(partial: Partial<LegalHubSummary>): LegalHubSummary {
  return {
    actorType: "seller",
    generatedAt: new Date().toISOString(),
    disclaimerLines: [],
    disclaimerItems: [],
    pendingActions: [],
    missingDataWarnings: [],
    portfolio: {
      totalWorkflows: 1,
      completedWorkflows: 0,
      pendingWorkflows: 1,
      criticalRiskCount: 0,
      warningRiskCount: 0,
      infoRiskCount: 0,
      documentCount: 0,
      pendingActionCount: 1,
    },
    workflows: [],
    risks: [],
    documents: [],
    ...partial,
  } as LegalHubSummary;
}

const obs: ObservationSnapshot = {
  id: "obs1",
  target: { type: "scan", id: null },
  signals: [],
  aggregates: {},
  facts: {},
  builtAt: new Date().toISOString(),
};

describe("Legal policy integration", () => {
  it("blocks publish_listing when seller disclosure accuracy not satisfied", async () => {
    const { buildLegalComplianceProposedAction } = await import("../execution/legal-compliance-action");
    const action = buildLegalComplianceProposedAction({
      gateAction: "publish_listing",
      correlationId: "user-1",
    });
    const summary = mkSummary({
      workflows: [
        {
          workflowType: "seller_disclosure",
          title: "",
          shortDescription: "",
          completionPercent: 0,
          currentPendingRequirementId: "accuracy_ack",
          nextRequiredAction: null,
          brokerOrAdminReviewRequired: true,
          requirements: [
            {
              definition: { id: "accuracy_ack", label: "Accuracy", description: "" },
              state: "not_started",
            },
          ],
        },
      ],
    });

    const ctx: PolicyContext = {
      action,
      observation: obs,
      autonomyMode: "SAFE_AUTOPILOT",
      targetActive: true,
      activePromotionCount: 0,
      priceDeltaTodayPct: 0,
      legalSummary: summary,
    };

    const decision = evaluateLegalCompliancePolicyOnly(ctx);
    expect(decision.disposition).toBe("BLOCK");
    expect(decision.violations.some((v) => v.ruleCode === legalHubComplianceRuleCode)).toBe(true);
  });

  it("allows when requirements satisfied", async () => {
    const { buildLegalComplianceProposedAction } = await import("../execution/legal-compliance-action");
    const action = buildLegalComplianceProposedAction({
      gateAction: "unlock_contact",
      correlationId: "user-2",
    });
    const summary = mkSummary({
      actorType: "broker",
      workflows: [
        {
          workflowType: "broker_mandate",
          title: "",
          shortDescription: "",
          completionPercent: 100,
          currentPendingRequirementId: null,
          nextRequiredAction: null,
          brokerOrAdminReviewRequired: true,
          requirements: [
            {
              definition: { id: "license_verification", label: "License", description: "" },
              state: "approved",
            },
            {
              definition: { id: "broker_agreement", label: "Agreement", description: "" },
              state: "approved",
            },
          ],
        },
        {
          workflowType: "privacy_consent",
          title: "",
          shortDescription: "",
          completionPercent: 100,
          currentPendingRequirementId: null,
          nextRequiredAction: null,
          brokerOrAdminReviewRequired: false,
          requirements: [
            {
              definition: { id: "privacy_policy", label: "Privacy", description: "" },
              state: "approved",
            },
          ],
        },
      ],
    });
    const ctx: PolicyContext = {
      action,
      observation: obs,
      autonomyMode: "SAFE_AUTOPILOT",
      targetActive: true,
      activePromotionCount: 0,
      priceDeltaTodayPct: 0,
      legalSummary: summary,
    };

    const decision = evaluateLegalCompliancePolicyOnly(ctx);
    expect(decision.disposition).toBe("ALLOW");
    expect(decision.violations).toHaveLength(0);
  });

  it("does not duplicate rule rows — single legal evaluator", async () => {
    const { buildLegalComplianceProposedAction } = await import("../execution/legal-compliance-action");
    const action = buildLegalComplianceProposedAction({
      gateAction: "submit_offer",
      correlationId: "user-3",
    });
    const summary = mkSummary({
      actorType: "buyer",
      workflows: [],
    });
    const ctx: PolicyContext = {
      action,
      observation: obs,
      autonomyMode: "ASSIST",
      targetActive: true,
      activePromotionCount: 0,
      priceDeltaTodayPct: 0,
      legalSummary: summary,
    };
    const decision = evaluateLegalCompliancePolicyOnly(ctx);
    const legalCodes = decision.ruleResults.filter((r) => r.ruleCode === legalHubComplianceRuleCode);
    expect(legalCodes.length).toBe(1);
  });
});
