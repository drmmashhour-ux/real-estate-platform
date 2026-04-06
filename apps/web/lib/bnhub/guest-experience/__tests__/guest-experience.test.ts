import { describe, expect, it } from "vitest";
import { bnhubGuestMessagingDelivery } from "../messaging-mode";
import { computePositiveExperienceSignals } from "../positive-experience";
import { reviewRequestDelayHours } from "../suppression";
import type { HostAutopilotConfig } from "@/lib/ai/autopilot/host-config";
import { DEFAULT_GUEST_MESSAGE_TRIGGERS } from "@/lib/ai/messaging/trigger-config";

describe("bnhubGuestMessagingDelivery", () => {
  it("returns auto_send_safe only for SAFE_AUTOPILOT with autopilot and autoMessaging", () => {
    const cfg: HostAutopilotConfig = {
      userId: "h1",
      autopilotEnabled: true,
      autopilotMode: "SAFE_AUTOPILOT",
      preferences: {
        autoPricing: false,
        autoMessaging: true,
        autoPromotions: false,
        autoListingOptimization: false,
      },
      lastAutopilotRunAt: null,
      guestMessaging: {
        autoGuestMessagingEnabled: true,
        guestMessageMode: "auto_send_safe",
        triggers: { ...DEFAULT_GUEST_MESSAGE_TRIGGERS },
        hostInternalChecklistEnabled: true,
      },
    };
    expect(bnhubGuestMessagingDelivery(cfg)).toBe("auto_send_safe");
  });

  it("returns draft_only for ASSIST when messaging enabled", () => {
    const cfg: HostAutopilotConfig = {
      userId: "h1",
      autopilotEnabled: true,
      autopilotMode: "ASSIST",
      preferences: {
        autoPricing: false,
        autoMessaging: true,
        autoPromotions: false,
        autoListingOptimization: false,
      },
      lastAutopilotRunAt: null,
      guestMessaging: {
        autoGuestMessagingEnabled: false,
        guestMessageMode: "draft_only",
        triggers: { ...DEFAULT_GUEST_MESSAGE_TRIGGERS },
        hostInternalChecklistEnabled: true,
      },
    };
    expect(bnhubGuestMessagingDelivery(cfg)).toBe("draft_only");
  });

  it("returns off when autoMessaging is false", () => {
    const cfg: HostAutopilotConfig = {
      userId: "h1",
      autopilotEnabled: true,
      autopilotMode: "SAFE_AUTOPILOT",
      preferences: {
        autoPricing: false,
        autoMessaging: false,
        autoPromotions: false,
        autoListingOptimization: false,
      },
      lastAutopilotRunAt: null,
      guestMessaging: {
        autoGuestMessagingEnabled: false,
        guestMessageMode: "draft_only",
        triggers: { ...DEFAULT_GUEST_MESSAGE_TRIGGERS },
        hostInternalChecklistEnabled: true,
      },
    };
    expect(bnhubGuestMessagingDelivery(cfg)).toBe("off");
  });
});

describe("computePositiveExperienceSignals", () => {
  it("marks negative when open issues exist", () => {
    const r = computePositiveExperienceSignals({
      booking: {
        checkedInAt: new Date(),
        checkedOutAt: null,
        checklistDeclaredByHostAt: new Date(),
        status: "COMPLETED",
      },
      issues: [{ status: "open" }],
      checkinDetails: { instructions: "x", keyInfo: null },
    });
    expect(r.positiveExperience).toBe(false);
  });
});

describe("reviewRequestDelayHours", () => {
  it("stays within 6–12h band", () => {
    const h = reviewRequestDelayHours("booking-uuid-test-123", false);
    expect(h).toBeGreaterThanOrEqual(6);
    expect(h).toBeLessThanOrEqual(12);
  });
});
