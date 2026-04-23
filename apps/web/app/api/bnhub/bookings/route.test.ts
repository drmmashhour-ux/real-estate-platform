import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/auth/session", () => ({ getGuestId: vi.fn() }));
vi.mock("@repo/db", () => ({
  prisma: {
    shortTermListing: { findUnique: vi.fn() },
    booking: { create: vi.fn() },
  },
}));
vi.mock("@/lib/bnhub/booking", () => ({ createBooking: vi.fn() }));
vi.mock("@/lib/bnhub/listings", () => ({ isListingAvailable: vi.fn().mockResolvedValue(true) }));
vi.mock("@/lib/operational-controls", () => ({ isBookingRestrictedFor: vi.fn().mockResolvedValue(false) }));
vi.mock("@/lib/policy-engine", () => ({ canConfirmBooking: vi.fn().mockResolvedValue({ allowed: true }) }));
vi.mock("@/lib/observability", () => ({ recordPlatformEvent: vi.fn() }));
vi.mock("@/lib/ai-fraud", () => ({ getFraudScore: vi.fn().mockResolvedValue({ score: 0 }) }));
vi.mock("@/lib/defense/abuse-prevention", () => ({ isUserRestricted: vi.fn().mockResolvedValue({ banned: false, suspended: false }) }));
vi.mock("@/lib/legal/content-license-enforcement", () => ({
  requireContentLicenseAccepted: vi.fn().mockResolvedValue(null),
}));

import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import { createBooking } from "@/lib/bnhub/booking";

describe("POST /api/bnhub/bookings", () => {
  beforeEach(() => {
    vi.mocked(getGuestId).mockResolvedValue("user-1");
    vi.mocked(prisma.shortTermListing.findUnique).mockResolvedValue({
      city: "Paris",
      listingStatus: "PUBLISHED",
      owner: { accountStatus: "ACTIVE" },
    } as never);
    vi.mocked(createBooking).mockResolvedValue({
      id: "booking-1",
      listingId: "listing-1",
      guestId: "user-1",
      checkIn: new Date("2025-06-01"),
      checkOut: new Date("2025-06-03"),
      status: "PENDING",
    } as never);
  });

  it("returns 401 when user is not signed in", async () => {
    vi.mocked(getGuestId).mockResolvedValue(null);
    const req = new Request("http://x/api/bnhub/bookings", {
      method: "POST",
      body: JSON.stringify({ listingId: "l1", checkIn: "2025-06-01", checkOut: "2025-06-03" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toMatch(/Sign in/i);
  });

  it("returns 400 when listingId, checkIn or checkOut is missing", async () => {
    const req = new Request("http://x/api/bnhub/bookings", {
      method: "POST",
      body: JSON.stringify({ listingId: "l1" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toMatch(/required/i);
  });

  it("returns 404 when listing not found", async () => {
    vi.mocked(prisma.shortTermListing.findUnique).mockResolvedValue(null);
    const req = new Request("http://x/api/bnhub/bookings", {
      method: "POST",
      body: JSON.stringify({ listingId: "missing", checkIn: "2025-06-01", checkOut: "2025-06-03" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req as never);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toMatch(/not found/i);
  });
});
