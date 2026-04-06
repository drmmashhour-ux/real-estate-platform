import { describe, expect, it, vi, beforeEach } from "vitest";
import { detectRisksForBooking } from "../risk-detection";
import { shouldSuppressRiskLog } from "../cooldown";
import type { BookingRiskContext } from "../types";

const baseCtx = (over: Partial<BookingRiskContext>): BookingRiskContext => ({
  bookingId: "b1",
  listingId: "l1",
  listingTitle: "Test listing",
  status: "CONFIRMED",
  guestId: "g1",
  hostId: "h1",
  checkIn: new Date(Date.now() + 24 * 60 * 60 * 1000),
  checkOut: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
  now: new Date(),
  checkedInAt: null,
  checklistDeclaredByHostAt: null,
  hasAdequateCheckinDetails: true,
  hostLastMessageAt: null,
  guestLastMessageAt: null,
  lastMessageAt: null,
  lastMessageSenderId: null,
  unresolvedIssueCount: 0,
  activeIssueCount: 0,
  listingOpenIssueCount90d: 0,
  review: null,
  listingVerificationStatus: "VERIFIED",
  listingHasPhotos: true,
  ...over,
});

describe("detectRisksForBooking", () => {
  it("flags missing check-in details as MEDIUM before arrival", () => {
    const risks = detectRisksForBooking(
      baseCtx({
        hasAdequateCheckinDetails: false,
        checkIn: new Date(Date.now() + 10 * 60 * 60 * 1000),
      })
    );
    const m = risks.find((r) => r.signalType === "MISSING_CHECKIN_DETAILS");
    expect(m?.riskLevel).toBe("MEDIUM");
    expect(m?.preventionAction).toBe("NOTIFY_BOTH_PARTIES");
    expect(m?.recommendedAction.toLowerCase()).not.toContain("refund");
  });

  it("classifies repeated booking issues as HIGH when multiple active issues on the booking", () => {
    const risks = detectRisksForBooking(
      baseCtx({
        activeIssueCount: 2,
      })
    );
    const r = risks.find((x) => x.signalType === "REPEATED_BOOKING_ISSUES");
    expect(r?.riskLevel).toBe("HIGH");
    expect(r?.preventionAction).toBe("NOTIFY_ADMIN_ESCALATION");
  });

  it("does not emit auto-resolution or financial/legal actions in copy", () => {
    const risks = detectRisksForBooking(
      baseCtx({
        activeIssueCount: 2,
        review: {
          propertyRating: 1,
          accuracyRating: 1,
          amenitiesAsAdvertised: false,
        },
      })
    );
    for (const r of risks) {
      expect(r.recommendedAction.toLowerCase()).not.toMatch(/we (will|have) (?:automatically )?resolved/);
      expect(r.summary.toLowerCase()).not.toMatch(/chargeback|lawsuit|automatic refund/);
    }
  });

  it("for COMPLETED stays, only evaluates post-stay style signals (no check-in checklist noise)", () => {
    const risks = detectRisksForBooking(
      baseCtx({
        status: "COMPLETED",
        checkIn: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        checkOut: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        hasAdequateCheckinDetails: false,
        checklistDeclaredByHostAt: null,
      })
    );
    expect(risks.some((r) => r.signalType === "MISSING_CHECKIN_DETAILS")).toBe(false);
    expect(risks.some((r) => r.signalType === "HOST_ROOM_READINESS_MISSING")).toBe(false);
  });

  it("flags slow guest response as LOW when last message is from host and stale", () => {
    const stale = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const risks = detectRisksForBooking(
      baseCtx({
        lastMessageAt: stale,
        lastMessageSenderId: "h1",
      })
    );
    const g = risks.find((r) => r.signalType === "GUEST_SLOW_RESPONSE");
    expect(g?.riskLevel).toBe("LOW");
    expect(g?.preventionAction).toBe("GENTLE_REMINDER");
  });
});

describe("shouldSuppressRiskLog", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("suppresses duplicate same-or-lower severity within cooldown", async () => {
    const findFirst = vi.fn().mockResolvedValue({ riskLevel: "MEDIUM" });
    const prisma = { aiDisputeRiskLog: { findFirst } } as never;
    const suppress = await shouldSuppressRiskLog({
      prisma,
      bookingId: "b1",
      signalType: "MISSING_CHECKIN_DETAILS",
      newLevel: "MEDIUM",
    });
    expect(suppress).toBe(true);
  });

  it("allows strictly higher severity than recent log", async () => {
    const findFirst = vi.fn().mockResolvedValue({ riskLevel: "LOW" });
    const prisma = { aiDisputeRiskLog: { findFirst } } as never;
    const suppress = await shouldSuppressRiskLog({
      prisma,
      bookingId: "b1",
      signalType: "NEGATIVE_FEEDBACK_SIGNAL",
      newLevel: "HIGH",
    });
    expect(suppress).toBe(false);
  });
});
