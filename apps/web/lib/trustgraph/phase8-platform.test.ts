import { describe, expect, it } from "vitest";
import { canonicalStringify, sha256Hex } from "@/lib/trustgraph/infrastructure/services/auditSerializationService";
import { hashApiKey } from "@/lib/trustgraph/infrastructure/services/apiKeyService";
import { evaluateComplianceRulesetRequirementRule } from "@/lib/trustgraph/infrastructure/rules/complianceRulesetRequirementRule";
import type { FsboListingRuleContext } from "@/lib/trustgraph/domain/types";

describe("Phase 8 — audit hash stability", () => {
  it("same payload yields same hash", () => {
    const a = { foo: 1, bar: "x" };
    const b = { bar: "x", foo: 1 };
    expect(sha256Hex(canonicalStringify(a))).toBe(sha256Hex(canonicalStringify(b)));
  });
});

describe("Phase 8 — API key hashing", () => {
  it("hashes deterministically", () => {
    expect(hashApiKey("secret")).toBe(hashApiKey("secret"));
    expect(hashApiKey("a")).not.toBe(hashApiKey("b"));
  });
});

describe("Phase 8 — compliance ruleset rule", () => {
  it("passes when no missing requirements", () => {
    const ctx = {
      phase8: { enabled: true, rulesetCode: "CA-QC", missingRequirements: [] },
    } as FsboListingRuleContext;
    const r = evaluateComplianceRulesetRequirementRule(ctx);
    expect(r.passed).toBe(true);
  });

  it("fails when requirements missing", () => {
    const ctx = {
      phase8: { enabled: true, rulesetCode: "CA-QC", missingRequirements: ["description"] },
    } as FsboListingRuleContext;
    const r = evaluateComplianceRulesetRequirementRule(ctx);
    expect(r.passed).toBe(false);
  });
});
