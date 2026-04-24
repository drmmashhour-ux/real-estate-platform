import { describe, expect, it, vi, beforeEach } from "vitest";
import { AccountStatus } from "@prisma/client";

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    amfInvestor: { findUnique: vi.fn() },
    amfSpv: { findUnique: vi.fn() },
    deal: { findUnique: vi.fn() },
    amfCapitalDeal: { findFirst: vi.fn() },
    amfDealDisclosure: { count: vi.fn() },
    amfDisclosureAcknowledgment: { count: vi.fn() },
  },
}));

import { prisma } from "@/lib/db";
import { assertPrivateInvestorPacketEligibility } from "../private-investor-packet-eligibility.service";

describe("assertPrivateInvestorPacketEligibility", () => {
  beforeEach(() => {
    vi.mocked(prisma.user.findUnique).mockReset();
    vi.mocked(prisma.amfInvestor.findUnique).mockReset();
    vi.mocked(prisma.amfSpv.findUnique).mockReset();
    vi.mocked(prisma.deal.findUnique).mockReset();
    vi.mocked(prisma.amfCapitalDeal.findFirst).mockReset();
    vi.mocked(prisma.amfDealDisclosure.count).mockReset();
    vi.mocked(prisma.amfDisclosureAcknowledgment.count).mockReset();
  });

  it("blocks when investor user missing", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    const r = await assertPrivateInvestorPacketEligibility({
      dealId: "deal-1",
      investorUserId: "u1",
      spvId: null,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.blockers.some((b) => /not found/i.test(b))).toBe(true);
  });

  it("blocks when account not active", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u1",
      accountStatus: AccountStatus.SUSPENDED,
      email: "a@b.c",
    } as never);
    vi.mocked(prisma.amfInvestor.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.deal.findUnique).mockResolvedValue({ listingId: null } as never);
    const r = await assertPrivateInvestorPacketEligibility({
      dealId: "deal-1",
      investorUserId: "u1",
      spvId: null,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.blockers.some((b) => /ACTIVE/i.test(b))).toBe(true);
  });

  it("blocks when capital deal exists but exemption preference missing in suitability", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u1",
      accountStatus: AccountStatus.ACTIVE,
      email: "a@b.c",
    } as never);
    vi.mocked(prisma.amfInvestor.findUnique).mockResolvedValue({
      id: "amf1",
      kycStatus: "VERIFIED",
      accreditationStatus: "ACCREDITED",
      suitabilityIntakeJson: { completed: true },
    } as never);
    vi.mocked(prisma.deal.findUnique).mockResolvedValue({ listingId: "lst1" } as never);
    vi.mocked(prisma.amfCapitalDeal.findFirst).mockResolvedValue({ id: "cd1" } as never);
    vi.mocked(prisma.amfDealDisclosure.count).mockResolvedValue(0);
    const r = await assertPrivateInvestorPacketEligibility({
      dealId: "deal-1",
      investorUserId: "u1",
      spvId: null,
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.blockers.some((b) => /Exemption path not selected/i.test(b))).toBe(true);
  });

  it("passes when AMF profile, KYC, accreditation, suitability, and disclosures ok", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u1",
      accountStatus: AccountStatus.ACTIVE,
      email: "a@b.c",
    } as never);
    vi.mocked(prisma.amfInvestor.findUnique).mockResolvedValue({
      id: "amf1",
      kycStatus: "VERIFIED",
      accreditationStatus: "ACCREDITED",
      suitabilityIntakeJson: { completed: true, exemptionPath: "ACCREDITED_INVESTOR" },
    } as never);
    vi.mocked(prisma.deal.findUnique).mockResolvedValue({ listingId: "lst1" } as never);
    vi.mocked(prisma.amfCapitalDeal.findFirst).mockResolvedValue({ id: "cd1" } as never);
    vi.mocked(prisma.amfDealDisclosure.count).mockResolvedValue(2);
    vi.mocked(prisma.amfDisclosureAcknowledgment.count).mockResolvedValue(2);
    const r = await assertPrivateInvestorPacketEligibility({
      dealId: "deal-1",
      investorUserId: "u1",
      spvId: null,
    });
    expect(r.ok).toBe(true);
  });
});
