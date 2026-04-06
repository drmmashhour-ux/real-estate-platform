import { describe, expect, it } from "vitest";
import {
  assertContentPassesAutoCloseSafetyRules,
  AUTO_CLOSE_INACTIVITY_TEMPLATE,
  isSafeAutoCloseAction,
} from "../autoCloseRules";

describe("autoCloseRules", () => {
  it("allowlists only safe action types", () => {
    expect(isSafeAutoCloseAction("follow_up_message")).toBe(true);
    expect(isSafeAutoCloseAction("booking_reminder")).toBe(true);
    expect(isSafeAutoCloseAction("inactivity_nudge")).toBe(true);
    expect(isSafeAutoCloseAction("wire_money")).toBe(false);
  });

  it("accepts default inactivity template as safe", () => {
    const r = assertContentPassesAutoCloseSafetyRules(
      AUTO_CLOSE_INACTIVITY_TEMPLATE.replace(/\{\{name\}\}/g, "Alex").replace(/\{\{listing_title\}\}/g, "123 Main St")
    );
    expect(r.ok).toBe(true);
  });

  it("blocks financial / promise / negotiation phrases", () => {
    expect(assertContentPassesAutoCloseSafetyRules("We guarantee you will love it").ok).toBe(false);
    expect(assertContentPassesAutoCloseSafetyRules("Please wire transfer $500 today").ok).toBe(false);
    expect(assertContentPassesAutoCloseSafetyRules("Sign today or lose the deal").ok).toBe(false);
    expect(assertContentPassesAutoCloseSafetyRules("Our counter-offer is firm at 400k").ok).toBe(false);
    expect(assertContentPassesAutoCloseSafetyRules("Get 15% off if you pay now").ok).toBe(false);
  });

  it("rejects empty or huge content", () => {
    expect(assertContentPassesAutoCloseSafetyRules("").ok).toBe(false);
    expect(assertContentPassesAutoCloseSafetyRules("short").ok).toBe(false);
    expect(assertContentPassesAutoCloseSafetyRules("x".repeat(3000)).ok).toBe(false);
  });
});
