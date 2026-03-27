import { describe, expect, it } from "vitest";
import { mapListingPublishRulesToIssues } from "@/lib/trustgraph/application/integrations/listingPublishIntegration";
import type { VerificationRuleResult } from "@prisma/client";

function row(partial: Partial<VerificationRuleResult>): VerificationRuleResult {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    caseId: "00000000-0000-4000-8000-000000000002",
    ruleCode: "X",
    ruleVersion: "1",
    passed: true,
    scoreDelta: 0,
    confidence: null,
    details: {},
    createdAt: new Date(),
    ...partial,
  } as VerificationRuleResult;
}

describe("mapListingPublishRulesToIssues", () => {
  it("treats declaration mandatory failure as blocking", () => {
    const { blocking, warnings } = mapListingPublishRulesToIssues([
      row({ ruleCode: "DECLARATION_MANDATORY_FIELDS_RULE", passed: false, details: {} }),
    ]);
    expect(blocking.length).toBe(1);
    expect(warnings.length).toBe(0);
  });

  it("treats address failure as warning-only by default", () => {
    const { blocking, warnings } = mapListingPublishRulesToIssues([
      row({ ruleCode: "ADDRESS_REQUIRED_FIELDS_RULE", passed: false, details: {} }),
    ]);
    expect(blocking.length).toBe(0);
    expect(warnings.length).toBe(1);
  });
});
