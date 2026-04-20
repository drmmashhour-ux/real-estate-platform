import { describe, expect, it } from "vitest";
import { buildLegalHubViewModel } from "../legal-view-model.service";
import type { LegalHubSummary } from "../legal.types";

const MIN_SUMMARY: LegalHubSummary = {
  actorType: "buyer",
  jurisdiction: "QC",
  generatedAt: new Date().toISOString(),
  disclaimerLines: ["Test disclaimer"],
  disclaimerItems: [{ id: "disc-1", text: "Test disclaimer", category: "general" }],
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
    pendingActionCount: 0,
  },
  workflows: [],
  risks: [],
  documents: [],
};

describe("buildLegalHubViewModel", () => {
  it("returns hero and empty-safe collections", () => {
    const vm = buildLegalHubViewModel({
      summary: MIN_SUMMARY,
      actor: "buyer",
      locale: "en",
      flags: {
        legalHubV1: true,
        legalHubDocumentsV1: true,
        legalHubRisksV1: true,
        legalHubAdminReviewV1: false,
        legalUploadV1: false,
        legalReviewV1: false,
        legalWorkflowSubmissionV1: false,
        legalEnforcementV1: false,
        legalReadinessV1: false,
      },
    });
    expect(vm.hero.title.length).toBeGreaterThan(0);
    expect(vm.workflowCards).toEqual([]);
    expect(Array.isArray(vm.disclaimerParagraphs)).toBe(true);
  });
});
