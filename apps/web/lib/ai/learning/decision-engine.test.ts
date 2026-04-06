import { describe, expect, it } from "vitest";
import {
  computeDecisionScoreFromFactors,
  getExecutionBand,
  shouldExecute,
  suppressionReasonForScore,
} from "./decision-engine";

describe("decision-engine scoring", () => {
  it("combines rule, template, and confidence weights", () => {
    const { score } = computeDecisionScoreFromFactors({
      ruleSuccessRate: 1,
      ruleHasData: true,
      bestTemplateScore: 1,
      templateHasData: true,
      calibratedConfidence: 1,
      repeatedRejections: false,
      recentRevert: false,
    });
    expect(score).toBeCloseTo(0.4 + 0.2 + 0.2, 5);
  });

  it("uses neutral rule/template when no data without low-performance reason", () => {
    const { score, reasons } = computeDecisionScoreFromFactors({
      ruleSuccessRate: 0.5,
      ruleHasData: false,
      bestTemplateScore: 0.5,
      templateHasData: false,
      calibratedConfidence: 0.5,
      repeatedRejections: false,
      recentRevert: false,
    });
    expect(score).toBeCloseTo(0.5 * 0.4 + 0.5 * 0.2 + 0.5 * 0.2, 5);
    expect(reasons).not.toContain("low rule performance");
    expect(reasons).not.toContain("high template success");
  });

  it("flags low rule performance when data exists and rate is low", () => {
    const { reasons } = computeDecisionScoreFromFactors({
      ruleSuccessRate: 0.2,
      ruleHasData: true,
      bestTemplateScore: 0.5,
      templateHasData: false,
      calibratedConfidence: 0.5,
      repeatedRejections: false,
      recentRevert: false,
    });
    expect(reasons).toContain("low rule performance");
  });

  it("flags high template success when template data is strong", () => {
    const { reasons } = computeDecisionScoreFromFactors({
      ruleSuccessRate: 0.5,
      ruleHasData: false,
      bestTemplateScore: 0.7,
      templateHasData: true,
      calibratedConfidence: 0.5,
      repeatedRejections: false,
      recentRevert: false,
    });
    expect(reasons).toContain("high template success");
  });
});

describe("decision-engine suppression", () => {
  it("shouldExecute is false below 0.3", () => {
    expect(shouldExecute(0.29)).toBe(false);
    expect(shouldExecute(0.3)).toBe(true);
  });

  it("getExecutionBand matches thresholds", () => {
    expect(getExecutionBand(0.2)).toBe("suppress");
    expect(getExecutionBand(0.45)).toBe("normal");
    expect(getExecutionBand(0.61)).toBe("prioritize");
    expect(getExecutionBand(0.6)).toBe("normal");
  });

  it("suppressionReasonForScore includes numeric score", () => {
    expect(suppressionReasonForScore(0.12)).toContain("0.120");
  });
});

describe("decision-engine negative signals", () => {
  it("applies penalties for repeated rejections and revert", () => {
    const base = computeDecisionScoreFromFactors({
      ruleSuccessRate: 0.5,
      ruleHasData: false,
      bestTemplateScore: 0.5,
      templateHasData: false,
      calibratedConfidence: 0.5,
      repeatedRejections: false,
      recentRevert: false,
    }).score;
    const penalized = computeDecisionScoreFromFactors({
      ruleSuccessRate: 0.5,
      ruleHasData: false,
      bestTemplateScore: 0.5,
      templateHasData: false,
      calibratedConfidence: 0.5,
      repeatedRejections: true,
      recentRevert: true,
    });
    expect(penalized.score).toBeCloseTo(base - 0.4, 5);
    expect(penalized.reasons).toContain("recent rejections");
    expect(penalized.reasons).toContain("recent revert");
  });
});
