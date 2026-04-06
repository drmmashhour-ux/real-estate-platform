import { describe, expect, it } from "vitest";
import { routeSideEffect } from "@/lib/system-brain/action-router";
import { decideFromFailureSignal, decideFromMarketplaceMetrics } from "@/lib/system-brain/decision-engine";
import { shouldAutoExecuteUnderSafeAutopilot } from "@/lib/system-brain/rule-engine";
import { isForbiddenAutonomousPrimitive } from "@/lib/system-brain/safety-guardrails";
import { categoryAlwaysRequiresApproval, evaluateActionKindRisk } from "@/lib/system-brain/risk-evaluator";

describe("decideFromFailureSignal", () => {
  it("routes manual_payment to admin review and high/critical risk", () => {
    const d = decideFromFailureSignal("manual_payment");
    expect(d.action).toBe("require_admin_review");
    expect(d.risk).toBe("high");
    expect(d.automationEligible).toBe(false);
  });

  it("routes booking_transition to admin review", () => {
    const d = decideFromFailureSignal("booking_transition");
    expect(d.action).toBe("require_admin_review");
    expect(d.risk).toBe("high");
  });

  it("routes infra to monitor_only", () => {
    const d = decideFromFailureSignal("infra_blocked");
    expect(d.action).toBe("monitor_only");
    expect(d.risk).toBe("low");
  });
});

describe("routeSideEffect", () => {
  it("blocks everything when OFF", () => {
    expect(routeSideEffect("OFF", "low_risk_internal").kind).toBe("blocked");
    expect(routeSideEffect("OFF", "payment_capture").kind).toBe("blocked");
  });

  it("ASSIST is suggest-only even for low risk", () => {
    expect(routeSideEffect("ASSIST", "low_risk_internal").kind).toBe("suggest_only");
  });

  it("SAFE_AUTOPILOT allows low_risk_internal auto", () => {
    expect(routeSideEffect("SAFE_AUTOPILOT", "low_risk_internal").kind).toBe("auto_safe_allowed");
  });

  it("payment_capture always ends in approval or suggest under non-OFF modes", () => {
    expect(routeSideEffect("SAFE_AUTOPILOT", "payment_capture").kind).toBe("requires_approval");
    expect(routeSideEffect("FULL_WITH_APPROVAL", "payment_capture").kind).toBe("requires_approval");
    expect(routeSideEffect("ASSIST", "payment_capture").kind).toBe("suggest_only");
  });
});

describe("categoryAlwaysRequiresApproval", () => {
  it("includes payment_capture", () => {
    expect(categoryAlwaysRequiresApproval("payment_capture")).toBe(true);
  });

  it("excludes non_monetary_recommendation", () => {
    expect(categoryAlwaysRequiresApproval("non_monetary_recommendation")).toBe(false);
  });
});

describe("decideFromMarketplaceMetrics", () => {
  it("alerts when booking failure rate high", () => {
    const d = decideFromMarketplaceMetrics({ bookingFailureRate: 0.25 });
    expect(d.action).toBe("alert_admin");
    expect(d.risk).toBe("high");
  });
});

describe("rule-engine & guardrails", () => {
  it("blocks forbidden primitives in safe autopilot rule", () => {
    expect(shouldAutoExecuteUnderSafeAutopilot({ type: "capture_payment", risk: "low" })).toBe(false);
    expect(isForbiddenAutonomousPrimitive("capture_payment")).toBe(true);
  });

  it("allows content_update when low risk", () => {
    expect(shouldAutoExecuteUnderSafeAutopilot({ type: "content_update", risk: "low" })).toBe(true);
  });
});

describe("evaluateActionKindRisk", () => {
  it("marks payment as critical", () => {
    expect(evaluateActionKindRisk("payment_capture")).toBe("critical");
  });
  it("marks content as low", () => {
    expect(evaluateActionKindRisk("listing_description")).toBe("low");
  });
});
