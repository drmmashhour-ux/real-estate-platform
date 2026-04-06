import { describe, expect, it } from "vitest";
import {
  applyOutcomeToHostPreferenceData,
  defaultHostPreferenceData,
  HOST_PROFILE_SENSITIVITY_MAX,
  HOST_PROFILE_WEIGHT_MAX,
  HOST_PROFILE_WEIGHT_MIN,
} from "./host-behavior";
import { selectBestTemplateKeyWithHostBoost } from "./template-performance";

const RULE = "host_autopilot_promotion_suggestion";

describe("host-behavior profile reducer", () => {
  it("starts from empty defaults", () => {
    const d = defaultHostPreferenceData();
    expect(d.preferredRuleWeights).toEqual({});
    expect(d.notificationSensitivity).toBe(0.5);
  });

  it("boosts rule weight on repeated approvals", () => {
    let d = defaultHostPreferenceData();
    for (let i = 0; i < 20; i += 1) {
      d = applyOutcomeToHostPreferenceData(d, RULE, "t1", "approved");
    }
    expect(d.preferredRuleWeights[RULE]).toBe(HOST_PROFILE_WEIGHT_MAX);
  });

  it("lowers rule weight on repeated rejections", () => {
    let d = defaultHostPreferenceData();
    for (let i = 0; i < 20; i += 1) {
      d = applyOutcomeToHostPreferenceData(d, RULE, null, "rejected");
    }
    expect(d.preferredRuleWeights[RULE]).toBe(HOST_PROFILE_WEIGHT_MIN);
  });

  it("boosts template preference on apply with template key", () => {
    let d = defaultHostPreferenceData();
    d = applyOutcomeToHostPreferenceData(d, RULE, "promo_a", "applied");
    d = applyOutcomeToHostPreferenceData(d, RULE, "promo_a", "applied");
    expect(d.preferredTemplateKeys[RULE]?.promo_a).toBeGreaterThan(1);
    expect(d.preferredTemplateKeys[RULE]?.promo_a).toBeLessThanOrEqual(HOST_PROFILE_WEIGHT_MAX);
  });

  it("lowers template after rejection", () => {
    let d = defaultHostPreferenceData();
    d = applyOutcomeToHostPreferenceData(d, RULE, "promo_a", "applied");
    d = applyOutcomeToHostPreferenceData(d, RULE, "promo_a", "rejected");
    expect(d.preferredTemplateKeys[RULE]?.promo_a).toBeLessThanOrEqual(1);
    expect(d.preferredTemplateKeys[RULE]?.promo_a).toBeGreaterThanOrEqual(HOST_PROFILE_WEIGHT_MIN);
  });

  it("increases notification sensitivity after repeated ignores", () => {
    let d = defaultHostPreferenceData();
    for (let i = 0; i < 15; i += 1) {
      d = applyOutcomeToHostPreferenceData(d, RULE, null, "ignored");
    }
    expect(d.rejectionPatterns.ignoreCount).toBe(15);
    expect(d.notificationSensitivity).toBe(HOST_PROFILE_SENSITIVITY_MAX);
  });

  it("reset semantics via fresh defaults", () => {
    let d = defaultHostPreferenceData();
    d = applyOutcomeToHostPreferenceData(d, RULE, null, "rejected");
    d = applyOutcomeToHostPreferenceData(d, RULE, null, "ignored");
    const reset = defaultHostPreferenceData();
    expect(reset.preferredRuleWeights).toEqual({});
    expect(reset.notificationSensitivity).toBe(0.5);
    expect(reset.rejectionPatterns.ignoreCount).toBe(0);
    expect(d.preferredRuleWeights[RULE]).toBeLessThan(1);
  });
});

describe("template selection with host boost", () => {
  it("prefers template with higher host boost when global rates tie", () => {
    const rows = [
      { templateKey: "a", impressions: 10, successes: 5 },
      { templateKey: "b", impressions: 10, successes: 5 },
    ];
    const r = selectBestTemplateKeyWithHostBoost(["a", "b"], rows, { a: 1, b: 1.4 });
    expect(r.templateKey).toBe("b");
    expect(r.usedFallback).toBe(false);
  });
});
