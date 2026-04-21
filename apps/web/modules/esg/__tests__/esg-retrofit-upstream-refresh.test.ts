import { describe, expect, it } from "vitest";
import {
  acquisitionReadinessBand,
  materialRetrofitUpstreamChange,
  type RetrofitUpstreamFingerprint,
} from "@/modules/esg/esg-retrofit-upstream-refresh";

function fp(p: Partial<RetrofitUpstreamFingerprint>): RetrofitUpstreamFingerprint {
  return {
    profilePresent: false,
    evidenceConfidence: null,
    dataCoveragePercent: null,
    compositeScore: null,
    grade: null,
    acquisitionScore: null,
    acquisitionRiskLevel: null,
    complianceOverallPercent: null,
    blockingIssuesCount: 0,
    openActions: 0,
    criticalOpenActions: 0,
    ...p,
  };
}

describe("materialRetrofitUpstreamChange", () => {
  it("detects acquisition score shift", () => {
    const a = fp({
      profilePresent: true,
      compositeScore: 55,
      dataCoveragePercent: 40,
      evidenceConfidence: 40,
      acquisitionScore: 42,
      acquisitionRiskLevel: "HIGH",
      openActions: 2,
    });
    const b = fp({
      profilePresent: true,
      compositeScore: 55,
      dataCoveragePercent: 40,
      evidenceConfidence: 40,
      acquisitionScore: 71,
      acquisitionRiskLevel: "HIGH",
      openActions: 2,
    });
    expect(materialRetrofitUpstreamChange(a, b)).toBe(true);
  });

  it("detects readiness band crossover for coverage/confidence thresholds", () => {
    const low = fp({
      profilePresent: true,
      compositeScore: 60,
      dataCoveragePercent: 20,
      evidenceConfidence: 40,
      openActions: 0,
    });
    const enough = fp({
      profilePresent: true,
      compositeScore: 60,
      dataCoveragePercent: 40,
      evidenceConfidence: 40,
      openActions: 0,
    });
    expect(acquisitionReadinessBand(low)).toBe("CONDITIONAL");
    expect(acquisitionReadinessBand(enough)).toBe("PASS_LIKELY");
    expect(materialRetrofitUpstreamChange(low, enough)).toBe(true);
  });

  it("does not trigger on tiny jitter below thresholds", () => {
    const a = fp({
      profilePresent: true,
      compositeScore: 55,
      dataCoveragePercent: 40,
      evidenceConfidence: 45,
      acquisitionScore: 62,
      acquisitionRiskLevel: "LOW",
      openActions: 3,
      criticalOpenActions: 1,
    });
    const b = fp({
      profilePresent: true,
      compositeScore: 55,
      dataCoveragePercent: 40,
      evidenceConfidence: 45.5,
      acquisitionScore: 62,
      acquisitionRiskLevel: "LOW",
      openActions: 3,
      criticalOpenActions: 1,
    });
    expect(materialRetrofitUpstreamChange(a, b)).toBe(false);
  });
});
