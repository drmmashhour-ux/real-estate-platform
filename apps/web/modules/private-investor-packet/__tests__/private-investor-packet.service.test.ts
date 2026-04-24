import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    privateInvestorPacket: { findFirst: vi.fn(), update: vi.fn() },
    deal: { findUnique: vi.fn() },
    user: { findUnique: vi.fn() },
    privateInvestorPacketEngagement: { create: vi.fn() },
  },
}));

vi.mock("../private-packet-audit.service", () => ({
  recordPrivatePacketAudit: vi.fn(),
  snapshotHashForPacket: vi.fn(() => "deadbeef"),
}));

import { prisma } from "@/lib/db";
import { approvePrivateInvestorPacket, releasePrivateInvestorPacket } from "../private-investor-packet.service";

describe("approvePrivateInvestorPacket", () => {
  beforeEach(() => {
    vi.mocked(prisma.privateInvestorPacket.findFirst).mockReset();
    vi.mocked(prisma.privateInvestorPacket.update).mockReset();
    vi.mocked(prisma.deal.findUnique).mockReset();
    vi.mocked(prisma.user.findUnique).mockReset();
  });

  it("rejects mutation when packet already released (immutable)", async () => {
    vi.mocked(prisma.privateInvestorPacket.findFirst).mockResolvedValue({
      id: "p1",
      status: "RELEASED",
      version: 1,
      investorId: "inv1",
      packetSummaryJson: {},
      documents: [],
    } as never);
    await expect(
      approvePrivateInvestorPacket({
        dealId: "d1",
        packetId: "p1",
        brokerUserId: "b1",
        attestationText: "I attest this packet is complete and accurate.",
        confirmDisclosuresCorrect: true,
      }),
    ).rejects.toThrow(/PACKET_IMMUTABLE/);
  });
});

describe("releasePrivateInvestorPacket", () => {
  beforeEach(() => {
    vi.mocked(prisma.privateInvestorPacket.findFirst).mockReset();
    vi.mocked(prisma.privateInvestorPacket.update).mockReset();
    vi.mocked(prisma.deal.findUnique).mockReset();
    vi.mocked(prisma.user.findUnique).mockReset();
    vi.mocked(prisma.privateInvestorPacketEngagement.create).mockReset();
  });

  it("requires APPROVED status before release", async () => {
    vi.mocked(prisma.privateInvestorPacket.findFirst).mockResolvedValue({
      id: "p1",
      status: "READY_FOR_REVIEW",
      version: 1,
      investorId: "inv1",
    } as never);
    vi.mocked(prisma.deal.findUnique).mockResolvedValue({ brokerId: "b1" } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ role: "BROKER" } as never);
    await expect(
      releasePrivateInvestorPacket({ dealId: "d1", packetId: "p1", brokerUserId: "b1" }),
    ).rejects.toThrow(/PACKET_NOT_APPROVED/);
  });
});
