import { describe, expect, it } from "vitest";
import { routeAgentKey } from "../routing/agent-router";
import { classifyActionKey, mayAutoExecute } from "../policies/action-policy";
import { decisionModeForAutopilot } from "../permissions";

describe("LECIPM Manager AI", () => {
  it("routes admin surface to admin_insights", () => {
    expect(routeAgentKey("how is the platform doing", { surface: "admin" })).toBe("admin_insights");
  });

  it("routes booking context to guest_support", () => {
    expect(routeAgentKey("hello", { bookingId: "b1" })).toBe("guest_support");
  });

  it("classifies forbidden actions", () => {
    expect(classifyActionKey("fabricate_metrics")).toBe("forbidden");
  });

  it("requires approval for live price changes", () => {
    expect(classifyActionKey("set_listing_price_live")).toBe("requires_approval");
  });

  it("mayAutoExecute safe drafts only in safe autopilot", () => {
    expect(mayAutoExecute("draft_listing_copy", false)).toBe(false);
    expect(mayAutoExecute("draft_listing_copy", true)).toBe(true);
  });

  it("maps autopilot modes to decision modes", () => {
    expect(decisionModeForAutopilot("OFF")).toBe("ASSIST_ONLY");
    expect(decisionModeForAutopilot("SAFE_AUTOPILOT")).toBe("AUTO_EXECUTE_SAFE");
  });
});
