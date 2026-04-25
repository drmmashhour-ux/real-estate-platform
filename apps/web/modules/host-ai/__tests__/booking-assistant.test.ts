import { describe, expect, it } from "vitest";
import { suggestBookingAssistance } from "../booking-assistant";

const base = {
  nights: 2,
  checkIn: new Date(Date.now() + 3 * 86400000),
  checkOut: new Date(Date.now() + 5 * 86400000),
  totalCents: 20_000,
  guestNotes: null,
  specialRequest: null,
  listingTitle: "Nice place",
  listingPartyAllowed: false,
  listingPetsAllowed: false,
  paymentStatus: "COMPLETED" as const,
  guestTrustRiskLevel: null as const,
};

describe("suggestBookingAssistance", () => {
  it("suggests review for non-approval state", () => {
    const r = suggestBookingAssistance({
      ...base,
      status: "CONFIRMED",
    });
    expect(r.suggestedAction).toBe("review");
  });

  it("nudges reject when party conflict", () => {
    const r = suggestBookingAssistance({
      ...base,
      status: "AWAITING_HOST_APPROVAL",
      specialRequest: "We want to host a big party on Saturday",
      paymentStatus: "COMPLETED",
    });
    expect(r.suggestedAction).toBe("reject");
    expect(r.risks.length).toBeGreaterThan(0);
  });

  it("leans accept when clean and paid", () => {
    const r = suggestBookingAssistance({
      ...base,
      status: "AWAITING_HOST_APPROVAL",
    });
    expect(r.suggestedAction).toBe("accept");
  });
});
