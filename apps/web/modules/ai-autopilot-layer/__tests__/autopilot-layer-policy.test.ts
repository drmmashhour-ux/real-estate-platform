import { describe, expect, it } from "vitest";
import {
  FORBIDDEN_ACTION_KEYS,
  isActionAllowedForMode,
  isForbiddenActionKey,
} from "../autopilotPolicy";
import { planAutopilotActions } from "../autopilotPlanner";
import type { AutopilotPlanContext } from "../types";

const baseCtx = (over: Partial<AutopilotPlanContext> = {}): AutopilotPlanContext => ({
  userId: "u1",
  role: "BROKER",
  ...over,
});

describe("AiAutopilotLayer policy", () => {
  it("blocks forbidden keys in all modes", () => {
    for (const k of FORBIDDEN_ACTION_KEYS) {
      expect(isForbiddenActionKey(k)).toBe(true);
      expect(isActionAllowedForMode(k, "FULL_AUTOPILOT_APPROVAL")).toBe(false);
    }
  });

  it("OFF mode yields no planned actions", () => {
    const p = planAutopilotActions("OFF", baseCtx({ representedStatus: "BUYER_NOT_REPRESENTED" }));
    expect(p).toEqual([]);
  });

  it("ASSIST allows suggest_broker_review", () => {
    expect(isActionAllowedForMode("suggest_broker_review", "ASSIST")).toBe(true);
    expect(isActionAllowedForMode("prepare_offer_package", "ASSIST")).toBe(false);
  });

  it("FULL_AUTOPILOT_APPROVAL allows prepare_payment_checkout", () => {
    expect(isActionAllowedForMode("prepare_payment_checkout", "FULL_AUTOPILOT_APPROVAL")).toBe(true);
  });
});
