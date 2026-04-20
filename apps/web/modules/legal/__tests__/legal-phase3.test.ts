import { describe, expect, it } from "vitest";
import { evaluateLegalGate } from "../legal-gate.service";
import { computeLegalReadinessScore } from "../legal-readiness.service";
import type { LegalGateContext } from "../legal-readiness.types";
import type { LegalHubSummary } from "../legal.types";

describe("Legal Hub Phase 3 — readiness score", () => {
  it("never yields ready level when critical risks exist", () => {
    const summary = {
      actorType: "buyer" as const,
      generatedAt: new Date().toISOString(),
      disclaimerLines: [],
      disclaimerItems: [],
      pendingActions: [],
      missingDataWarnings: [],
      portfolio: {
        totalWorkflows: 1,
        completedWorkflows: 1,
        pendingWorkflows: 0,
        criticalRiskCount: 2,
        warningRiskCount: 0,
        infoRiskCount: 0,
        documentCount: 0,
        pendingActionCount: 0,
      },
      workflows: [
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
              definition: {
                id: "privacy_policy",
                label: "Privacy",
                description: "",
              },
              state: "approved" as const,
            },
          ],
        },
      ],
      risks: [],
      documents: [],
    } satisfies LegalHubSummary;

    const r = computeLegalReadinessScore(summary);
    expect(r.level).not.toBe("ready");
    expect(r.score).toBeLessThanOrEqual(89);
  });

  it("penalizes rejected requirement rows", () => {
    const summary = {
      actorType: "seller" as const,
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
      workflows: [
        {
          workflowType: "seller_disclosure",
          title: "",
          shortDescription: "",
          completionPercent: 0,
          currentPendingRequirementId: "accuracy_ack",
          nextRequiredAction: "x",
          brokerOrAdminReviewRequired: true,
          requirements: [
            {
              definition: {
                id: "accuracy_ack",
                label: "Accuracy",
                description: "",
              },
              state: "rejected" as const,
            },
          ],
        },
      ],
      risks: [],
      documents: [],
    } satisfies LegalHubSummary;

    const r = computeLegalReadinessScore(summary);
    expect(r.score).toBeLessThan(70);
    expect(r.level).not.toBe("ready");
  });
});

describe("Legal Hub Phase 3 — gate engine", () => {
  it("hard-blocks missing mandatory checklist items for publish_listing (seller)", () => {
    const ctx: LegalGateContext = {
      actorType: "seller",
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
      risks: [],
    };

    const g = evaluateLegalGate("publish_listing", ctx);
    expect(g.allowed).toBe(false);
    expect(g.mode).toBe("hard");
    expect(g.blockingRequirements.some((k) => k.includes("seller_disclosure:accuracy_ack"))).toBe(true);
  });

  it("allows with soft warnings only when hard rules pass", () => {
    const ctx: LegalGateContext = {
      actorType: "seller",
      workflows: [
        {
          workflowType: "seller_disclosure",
          title: "",
          shortDescription: "",
          completionPercent: 100,
          currentPendingRequirementId: null,
          nextRequiredAction: null,
          brokerOrAdminReviewRequired: true,
          requirements: [
            {
              definition: { id: "accuracy_ack", label: "Accuracy", description: "" },
              state: "submitted",
            },
            {
              definition: { id: "verification_gate", label: "Verification", description: "" },
              state: "not_started",
            },
          ],
        },
        {
          workflowType: "identity_verification",
          title: "",
          shortDescription: "",
          completionPercent: 0,
          currentPendingRequirementId: "submit_id",
          nextRequiredAction: null,
          brokerOrAdminReviewRequired: true,
          requirements: [
            {
              definition: { id: "submit_id", label: "ID", description: "" },
              state: "not_started",
            },
          ],
        },
      ],
      risks: [],
    };

    const g = evaluateLegalGate("publish_listing", ctx);
    expect(g.allowed).toBe(true);
    expect(g.mode).toBe("soft");
    expect(g.reasons.some((r) => r.startsWith("Advisory"))).toBe(true);
  });

  it("blocks submit_offer when critical risk present", () => {
    const ctx: LegalGateContext = {
      actorType: "buyer",
      workflows: [
        {
          workflowType: "purchase_offer",
          title: "",
          shortDescription: "",
          completionPercent: 100,
          currentPendingRequirementId: null,
          nextRequiredAction: null,
          brokerOrAdminReviewRequired: true,
          requirements: [
            {
              definition: { id: "identity_ready", label: "ID", description: "" },
              state: "submitted",
            },
            {
              definition: { id: "terms_payment", label: "Terms", description: "" },
              state: "submitted",
            },
          ],
        },
      ],
      risks: [
        {
          id: "risk-1",
          severity: "critical",
          title: "Terms gap",
          message: "x",
        },
      ],
    };

    const g = evaluateLegalGate("submit_offer", ctx);
    expect(g.allowed).toBe(false);
    expect(g.blockingRequirements.some((k) => k.startsWith("risk:"))).toBe(true);
  });
});
