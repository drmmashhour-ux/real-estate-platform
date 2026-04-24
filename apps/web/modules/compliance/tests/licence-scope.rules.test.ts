import { describe, expect, it } from "vitest";
import { runComplianceEngine } from "@/modules/compliance/core/engine";
import type { ComplianceCaseContext } from "@/modules/compliance/core/rule-types";

const okBase = {
  brokerIdentityVerified: true,
  oaciqLicenceRecordVerified: true,
  licenceCategoryResidential: true,
  licenceStatusActive: true,
  brokerAttachedToTransaction: true,
  platformAcknowledgesAiAssistOnly: true,
  transactionWithinResidentialScope: true,
} satisfies NonNullable<ComplianceCaseContext["brokerageLicence"]>;

describe("licence scope rules (unified engine)", () => {
  it("blocks when licence status not active", () => {
    const report = runComplianceEngine({
      caseId: "lic-1",
      brokerageLicence: { ...okBase, licenceStatusActive: false },
    });
    expect(report.decision.blockingFailures.some((f) => f.ruleId === "licence_status_active")).toBe(true);
  });

  it("blocks when transaction outside residential scope", () => {
    const report = runComplianceEngine({
      caseId: "lic-2",
      brokerageLicence: { ...okBase, transactionWithinResidentialScope: false },
    });
    expect(report.decision.blockingFailures.some((f) => f.ruleId === "residential_scope_transaction_allowed")).toBe(
      true,
    );
  });

  it("warns when property classification unclear (non-blocking)", () => {
    const report = runComplianceEngine({
      caseId: "lic-3",
      brokerageLicence: { ...okBase, propertyClassificationUnclear: true },
    });
    const row = report.results.find((r) => r.ruleId === "property_classification_unclear_risk");
    expect(row?.passed).toBe(false);
    expect(row?.blocking).toBe(false);
    expect(report.decision.status === "warning" || report.decision.status === "review_required").toBe(true);
  });

  it("passes when all licence gates satisfied", () => {
    const report = runComplianceEngine({
      caseId: "lic-4",
      brokerageLicence: { ...okBase },
    });
    const licenceResults = report.byCategory.licence;
    expect(licenceResults.every((r) => r.passed)).toBe(true);
  });
});
