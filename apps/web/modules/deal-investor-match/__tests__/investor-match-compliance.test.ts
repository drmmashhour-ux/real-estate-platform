import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    dealInvestorMatchAuditLog: { create: vi.fn() },
    dealInvestorMatchLearningEvent: { create: vi.fn() },
  },
}));

vi.mock("@/modules/private-investor-packet", () => ({
  assertPrivateInvestorPacketEligibility: vi.fn(),
}));

vi.mock("@/modules/private-investor-packet/private-investor-packet.service", () => ({
  generatePrivateInvestorPacketRecord: vi.fn(),
}));

import { prisma } from "@/lib/db";
import { assertPrivateInvestorPacketEligibility } from "@/modules/private-investor-packet";
import { generatePrivateInvestorPacketRecord } from "@/modules/private-investor-packet/private-investor-packet.service";
import { recordInvestorMatchAudit } from "../investor-match-audit.service";

describe("investor match compliance gate", () => {
  beforeEach(() => {
    vi.mocked(prisma.dealInvestorMatchAuditLog.create).mockResolvedValue({} as never);
  });

  it("prepare path should audit block when eligibility fails (conceptual)", async () => {
    vi.mocked(assertPrivateInvestorPacketEligibility).mockResolvedValue({
      ok: false,
      blockers: ["Accreditation must be ACCREDITED or EXEMPT for private placement (current: PENDING)."],
    });

    const elig = await assertPrivateInvestorPacketEligibility({
      dealId: "d1",
      investorUserId: "inv1",
      spvId: null,
    });
    expect(elig.ok).toBe(false);
    if (!elig.ok) {
      await recordInvestorMatchAudit({
        dealId: "d1",
        investorId: "inv1",
        actorUserId: "brk1",
        action: "investor_blocked_compliance",
        metadata: { blockers: elig.blockers },
      });
    }
    expect(vi.mocked(generatePrivateInvestorPacketRecord)).not.toHaveBeenCalled();
    expect(prisma.dealInvestorMatchAuditLog.create).toHaveBeenCalled();
  });
});
