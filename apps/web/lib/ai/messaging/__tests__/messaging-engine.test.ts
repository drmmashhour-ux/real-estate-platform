import { describe, expect, it } from "vitest";
import { renderHostLifecycleTemplate } from "../templates";
import { mergeGuestMessageTriggers, DEFAULT_GUEST_MESSAGE_TRIGGERS } from "../trigger-config";

describe("templates", () => {
  it("renders booking confirmation in EN", () => {
    const t = renderHostLifecycleTemplate("booking_confirmation", "en", {
      guestName: "Sam",
      listingTitle: "Cozy loft",
      checkInLabel: "Jan 2",
      checkOutLabel: "Jan 5",
      nights: 3,
    });
    expect(t).toContain("confirmed");
    expect(t).toContain("Cozy loft");
  });

  it("renders French pre-checkin", () => {
    const t = renderHostLifecycleTemplate("pre_checkin", "fr", {
      guestName: "Sam",
      listingTitle: "Loft",
      checkInLabel: "2 janv.",
      checkOutLabel: "5 janv.",
      nights: 3,
    });
    expect(t.length).toBeGreaterThan(10);
  });
});

describe("mergeGuestMessageTriggers", () => {
  it("defaults all triggers off", () => {
    const m = mergeGuestMessageTriggers({});
    expect(m.booking_confirmed.enabled).toBe(false);
    expect(DEFAULT_GUEST_MESSAGE_TRIGGERS.post_checkout.enabled).toBe(false);
  });

  it("merges partial json", () => {
    const m = mergeGuestMessageTriggers({ booking_confirmed: { enabled: true } });
    expect(m.booking_confirmed.enabled).toBe(true);
    expect(m.pre_checkin.enabled).toBe(false);
  });
});
