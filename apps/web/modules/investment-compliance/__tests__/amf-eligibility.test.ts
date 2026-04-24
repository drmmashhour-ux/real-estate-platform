import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/db", () => ({
  prisma: {
    amfInvestor: {
      findFirst: vi.fn(),
    },
  },
}));

describe("AMF private exempt eligibility", () => {
  it("blocks non-accredited investor on accredited path", async () => {
    const { prisma } = await import("@repo/db");
    vi.mocked(prisma.amfInvestor.findFirst).mockResolvedValue({
      accreditationStatus: "PENDING",
      suitabilityIntakeJson: null,
    } as never);

    const { assertInvestorEligibleForExemption } = await import("../amf-exemption.service");

    await expect(
      assertInvestorEligibleForExemption({
        investorUserId: "u1",
        exemption: "ACCREDITED_INVESTOR",
      }),
    ).rejects.toThrow(/eligibility not recorded/);
  });
});
