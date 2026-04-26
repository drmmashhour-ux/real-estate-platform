import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/legacy", () => ({
  getLegacyDB: () => ({
    amfInvestor: {
      findFirst: vi.fn(),
    },
  })
}));

describe("AMF private exempt eligibility", () => {
  it("blocks non-accredited investor on accredited path", async () => {
    const { getLegacyDB } = await import("@/lib/db/legacy");
    const prisma = getLegacyDB();
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
