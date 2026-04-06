import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";
import { InsuranceLeadStatus, InsuranceLeadType, InsuranceLeadSource } from "@prisma/client";
import { POST, GET } from "./route";

vi.mock("@/lib/insurance/lead-analytics", () => ({
  trackLeadEvent: vi.fn().mockResolvedValue(undefined),
  getLeadConversionStats: vi.fn().mockResolvedValue({
    windowDays: 30,
    totalViews: 100,
    totalStarts: 40,
    totalSubmissions: 10,
    totalFailures: 2,
    viewToSubmitPct: 10,
    startToSubmitPct: 25,
  }),
  getLeadSubmissionsByFunnelSource: vi.fn().mockResolvedValue([
    { funnelSource: "booking", submissions: 6 },
    { funnelSource: "listing", submissions: 4 },
  ]),
  getLeadSubmissionsByLeadType: vi.fn().mockResolvedValue([
    { leadType: "TRAVEL", count: 5 },
    { leadType: "PROPERTY", count: 5 },
  ]),
}));

vi.mock("@/lib/insurance/assign-partner", () => ({
  assignInsurancePartner: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/db", () => ({
  prisma: {
    insuranceLead: { create: vi.fn(), findMany: vi.fn(), update: vi.fn(), findFirst: vi.fn() },
    insurancePartner: { findFirst: vi.fn(), findUnique: vi.fn(), findMany: vi.fn() },
    user: { findUnique: vi.fn() },
    shortTermListing: { findUnique: vi.fn() },
    fsboListing: { findUnique: vi.fn() },
    listing: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/auth/session", () => ({
  getGuestId: vi.fn(),
}));

vi.mock("@/lib/email/send-insurance-lead", () => ({
  sendInsuranceLeadToPartner: vi.fn().mockResolvedValue(true),
}));

vi.mock("@/lib/logger", () => ({
  logInfo: vi.fn(),
  logWarn: vi.fn(),
}));

import { prisma } from "@/lib/db";
import { getGuestId } from "@/lib/auth/session";
import { sendInsuranceLeadToPartner } from "@/lib/email/send-insurance-lead";

const CONSENT_FULL =
  "I agree to be contacted by a licensed insurance broker regarding my request. You may be contacted by a licensed insurance broker.";

function jsonRequest(body: Record<string, unknown>) {
  const req = new Request("http://localhost/api/insurance/leads", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  }) as NextRequest;
  (req as { nextUrl: URL }).nextUrl = new URL("http://localhost/api/insurance/leads");
  return req;
}

describe("POST /api/insurance/leads", () => {
  beforeEach(() => {
    vi.mocked(getGuestId).mockResolvedValue(null);
    vi.mocked(prisma.insurancePartner.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.insurancePartner.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.insuranceLead.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.shortTermListing.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.fsboListing.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.listing.findUnique).mockResolvedValue(null);
    vi.mocked(sendInsuranceLeadToPartner).mockResolvedValue(true);
  });

  it("rejects when consentGiven is not true", async () => {
    const res = await POST(
      jsonRequest({
        email: "a@b.co",
        leadType: "travel",
        source: "listing",
        consentGiven: false,
      })
    );
    expect(res.status).toBe(400);
  });

  it("creates a valid lead", async () => {
    vi.mocked(prisma.insuranceLead.create).mockResolvedValue({
      id: "lead-1",
      userId: null,
      email: "guest@test.com",
      phone: null,
      fullName: null,
      leadType: InsuranceLeadType.TRAVEL,
      listingId: null,
      bookingId: null,
      source: InsuranceLeadSource.LISTING,
      message: null,
      consentGiven: true,
      consentText: CONSENT_FULL,
      status: InsuranceLeadStatus.NEW,
      partnerId: null,
      estimatedValue: null,
      leadScore: 0,
      variantId: null,
      metadata: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(prisma.insuranceLead.update).mockResolvedValue({} as never);

    const res = await POST(
      jsonRequest({
        email: "guest@test.com",
        leadType: "travel",
        source: "listing",
        consentGiven: true,
      })
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok?: boolean; leadId?: string };
    expect(body.ok).toBe(true);
    expect(body.leadId).toBe("lead-1");
    expect(prisma.insuranceLead.create).toHaveBeenCalled();
  });
});

describe("GET /api/insurance/leads", () => {
  beforeEach(() => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "ADMIN" } as never);
    vi.mocked(getGuestId).mockResolvedValue("admin-1");
    vi.mocked(prisma.insuranceLead.findMany).mockResolvedValue([]);
  });

  it("returns leads for admin", async () => {
    vi.mocked(prisma.insuranceLead.findMany).mockResolvedValue([
      {
        id: "l1",
        email: "x@y.z",
        phone: null,
        fullName: null,
        leadType: InsuranceLeadType.PROPERTY,
        listingId: "lst",
        bookingId: null,
        source: InsuranceLeadSource.LISTING,
        message: null,
        consentGiven: true,
        consentText: CONSENT_FULL,
        status: InsuranceLeadStatus.SENT,
        partnerId: "p1",
        estimatedValue: null,
        leadScore: 5,
        variantId: "A",
        createdAt: new Date(),
        updatedAt: new Date(),
        partner: {
          id: "p1",
          name: "Partner",
          contactEmail: "p@example.com",
          fixedPricePerLead: { toString: () => "25.00" } as never,
          basePricePerLead: { toString: () => "25.00" } as never,
          bonusHighQualityLead: { toString: () => "10.00" } as never,
        },
      } as never,
    ]);

    const req = new Request("http://localhost/api/insurance/leads?stats=1") as NextRequest;
    (req as { nextUrl: URL }).nextUrl = new URL("http://localhost/api/insurance/leads?stats=1");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok?: boolean;
      leads?: unknown[];
      conversionStats?: { totalViews: number };
      topFunnelSource?: string | null;
    };
    expect(body.ok).toBe(true);
    expect(Array.isArray(body.leads)).toBe(true);
    expect(body.leads?.length).toBe(1);
    expect(body.conversionStats?.totalViews).toBe(100);
    expect(body.topFunnelSource).toBe("booking");
  });
});
