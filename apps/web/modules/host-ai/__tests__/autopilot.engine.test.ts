import { describe, expect, it } from "vitest";
import { evaluateAutopilotActions } from "../autopilot.engine";
import type { HostAutopilotConfig } from "@/lib/ai/autopilot/host-config";

const baseCfg = (over: Partial<HostAutopilotConfig> = {}): HostAutopilotConfig => ({
  userId: "u1",
  autopilotEnabled: true,
  autopilotMode: "ASSIST",
  preferences: {
    autoPricing: true,
    autoMessaging: true,
    autoPromotions: false,
    autoListingOptimization: true,
  },
  lastAutopilotRunAt: null,
  guestMessaging: {
    autoGuestMessagingEnabled: true,
    guestMessageMode: "draft_only",
    triggers: {},
    hostInternalChecklistEnabled: false,
  },
  ...over,
});

describe("evaluateAutopilotActions", () => {
  it("returns empty guidance when autopilot off", () => {
    const r = evaluateAutopilotActions({
      config: baseCfg({ autopilotEnabled: false }),
      listings: [],
      bookingsAwaitingApproval: [],
    });
    expect(r.actions.length).toBe(0);
    expect(r.rulesApplied).toContain("autopilot_disabled");
  });

  it("never proposes auto-accept for bookings", () => {
    const r = evaluateAutopilotActions({
      config: baseCfg(),
      listings: [{ id: "l1", title: "A", city: "Montreal", nightPriceCents: 10000, photos: ["a", "b", "c"] }],
      bookingsAwaitingApproval: [
        {
          id: "b1",
          listingId: "l1",
          listingTitle: "A",
          createdAt: new Date(),
          totalCents: 300_000,
        },
      ],
    });
    const bookingActs = r.actions.filter((a) => a.kind === "booking_recommendation");
    expect(bookingActs.length).toBeGreaterThan(0);
    expect(bookingActs.every((a) => a.executionHint === "manual_only")).toBe(true);
    expect(r.rulesApplied).toContain("no_auto_booking_accept");
  });
});
