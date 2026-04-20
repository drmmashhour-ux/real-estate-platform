import { describe, expect, it } from "vitest";
import { parseLegalRecord } from "../legal-record-parser.service";
import { validateLegalRecord } from "../legal-record-validation.service";
import { evaluateLegalRules } from "../legal-rule-engine.service";
import { finalizeLegalRecordStatus } from "../legal-record-import.service";
import { computeLegalRecordComplianceGap01 } from "../legal-record-preview.service";
import { computeTrustScore } from "@/modules/trust/trust-score.service";

describe("legal record pipeline (deterministic)", () => {
  it("parses seller_declaration fields without throwing", () => {
    const p = parseLegalRecord({
      recordType: "seller_declaration",
      structuredInput: {
        hasKnownDefects: false,
        yearBuilt: 1998,
        occupancyStatus: "owner_occupied",
      },
    });
    expect(p.hasKnownDefects).toBe(false);
    expect(p.yearBuilt).toBe(1998);
    expect(p.occupancyStatus).toBe("owner_occupied");
    expect(Array.isArray(p._missingKeys)).toBe(false);
  });

  it("marks missing seller_declaration keys explicitly", () => {
    const p = parseLegalRecord({
      recordType: "seller_declaration",
      structuredInput: {},
    });
    expect(Array.isArray(p._missingKeys)).toBe(true);
    expect((p._missingKeys as string[]).length).toBeGreaterThan(0);
  });

  it("validates seller_declaration bounds", () => {
    const parsed = parseLegalRecord({
      recordType: "seller_declaration",
      structuredInput: { hasKnownDefects: true, yearBuilt: 1700, occupancyStatus: "x" },
    });
    const v = validateLegalRecord({ recordType: "seller_declaration", parsedData: parsed });
    expect(v.inconsistentFields).toContain("yearBuilt");
  });

  it("evaluates rules from validation outcomes", () => {
    const parsed = parseLegalRecord({
      recordType: "seller_declaration",
      structuredInput: {},
    });
    const v = validateLegalRecord({ recordType: "seller_declaration", parsedData: parsed });
    const rules = evaluateLegalRules({ recordType: "seller_declaration", parsedData: parsed, validation: v });
    expect(rules.length).toBeGreaterThan(0);
    expect(() => finalizeLegalRecordStatus(v, rules)).not.toThrow();
  });

  it("computes compliance gap in 0–1", () => {
    const g = computeLegalRecordComplianceGap01({
      missingTotal: 2,
      inconsistentTotal: 1,
      criticalRulesTotal: 0,
      recordCount: 2,
    });
    expect(g).toBeGreaterThanOrEqual(0);
    expect(g).toBeLessThanOrEqual(1);
  });

  it("applies bounded trust adjustment for legal compliance gap", () => {
    const baseReadiness = {
      score: 70,
      level: "ready" as const,
      missingCritical: 0,
      missingOptional: 0,
      completed: 4,
      total: 4,
    };
    const hi = computeTrustScore({
      legalRecordComplianceGap01: 1,
      legalReadinessScore: baseReadiness,
      legalIntelligenceSummary: null,
    });
    const lo = computeTrustScore({
      legalRecordComplianceGap01: 0,
      legalReadinessScore: baseReadiness,
      legalIntelligenceSummary: null,
    });
    expect(hi.score).toBeLessThan(lo.score);
  });
});
