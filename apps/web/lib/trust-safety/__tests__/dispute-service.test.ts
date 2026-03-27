/**
 * Tests for dispute service – submitComplaint (24h window), resolveDispute outcomes, hostRespondToDispute.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { submitComplaint, resolveDispute, hostRespondToDispute } from "@/lib/trust-safety/dispute-service";

const mockBooking = {
  id: "b1",
  guestId: "guest1",
  listingId: "l1",
  listing: { id: "l1", ownerId: "host1" },
  status: "CONFIRMED",
  checkIn: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12h ago
  payment: { id: "p1" },
};

vi.mock("@/lib/db", () => ({
  prisma: {
    booking: { findUnique: vi.fn() },
    dispute: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    payment: { update: vi.fn() },
    disputeResolution: { create: vi.fn() },
    shortTermListing: { updateMany: vi.fn() },
    hostAccountWarning: { create: vi.fn() },
    hostRiskHistory: { create: vi.fn() },
    disputeMessage: { create: vi.fn() },
    $transaction: vi.fn((arg: Promise<unknown>[]) => Promise.all(arg)),
  },
}));

vi.mock("@/lib/trust-safety/payout-hold-service", () => ({
  createPayoutHold: vi.fn().mockResolvedValue(undefined),
  releasePayoutHoldsForBooking: vi.fn().mockResolvedValue(1),
  markHoldsRefundedForBooking: vi.fn().mockResolvedValue(1),
}));

const { prisma } = await import("@/lib/db");

describe("Dispute service", () => {
  beforeEach(() => {
    vi.mocked(prisma.booking.findUnique).mockResolvedValue(mockBooking as never);
    vi.mocked(prisma.dispute.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.dispute.create).mockResolvedValue({
      id: "d1",
      bookingId: "b1",
      listingId: "l1",
      claimant: "GUEST",
      claimantUserId: "guest1",
      description: "Test",
      complaintCategory: "cleanliness_issue",
      status: "SUBMITTED",
      urgencyLevel: "normal",
    } as never);
    vi.mocked(prisma.payment.update).mockResolvedValue({} as never);
  });

  describe("submitComplaint", () => {
    it("creates dispute and freezes payout when within 24h of check-in", async () => {
      const result = await submitComplaint({
        bookingId: "b1",
        claimantUserId: "guest1",
        description: "Property was dirty",
        complaintCategory: "cleanliness_issue",
      });
      expect(result.disputeId).toBe("d1");
      expect(result.payoutFrozen).toBe(true);
      expect(prisma.dispute.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "SUBMITTED",
            complaintCategory: "cleanliness_issue",
          }),
        })
      );
    });

    it("throws when complaint is after 24h of check-in", async () => {
      vi.mocked(prisma.booking.findUnique).mockResolvedValue({
        ...mockBooking,
        checkIn: new Date(Date.now() - 25 * 60 * 60 * 1000),
      } as never);
      await expect(
        submitComplaint({
          bookingId: "b1",
          claimantUserId: "guest1",
          description: "Late",
          complaintCategory: "other",
        })
      ).rejects.toThrow(/within 24 hours/);
    });

    it("throws when not the guest", async () => {
      await expect(
        submitComplaint({
          bookingId: "b1",
          claimantUserId: "other",
          description: "x",
          complaintCategory: "other",
        })
      ).rejects.toThrow("Only the guest");
    });
  });

  describe("hostRespondToDispute", () => {
    const disputeWithListing = {
      id: "d1",
      listing: { ownerId: "host1" },
      status: "SUBMITTED",
    };
    beforeEach(() => {
      vi.mocked(prisma.dispute.findUniqueOrThrow).mockResolvedValue(disputeWithListing as never);
      vi.mocked(prisma.disputeMessage.create).mockResolvedValue({} as never);
      vi.mocked(prisma.dispute.update).mockResolvedValue({} as never);
    });

    it("adds message and sets status to UNDER_REVIEW", async () => {
      await hostRespondToDispute("d1", "host1", "We will fix this.");
      expect(prisma.dispute.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "UNDER_REVIEW" }),
        })
      );
    });

    it("throws when not the host", async () => {
      await expect(hostRespondToDispute("d1", "other", "Hi")).rejects.toThrow("Only the host");
    });
  });

  describe("resolveDispute", () => {
    beforeEach(() => {
      vi.mocked(prisma.dispute.findUnique).mockResolvedValue({
        id: "d1",
        status: "UNDER_REVIEW",
        booking: { id: "b1", checkIn: new Date(), payment: { id: "p1", payoutHoldReason: "dispute" } },
        listing: { ownerId: "host1" },
      } as never);
      vi.mocked(prisma.dispute.update).mockResolvedValue({} as never);
      vi.mocked(prisma.disputeResolution.create).mockResolvedValue({} as never);
    });

    it("creates DisputeResolution and sets status to RESOLVED_PARTIAL_REFUND for partial_refund", async () => {
      await resolveDispute({
        disputeId: "d1",
        resolvedBy: "admin1",
        resolutionOutcome: "partial_refund",
        refundCents: 5000,
      });
      expect(prisma.disputeResolution.create).toHaveBeenCalled();
      expect(prisma.dispute.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: "RESOLVED_PARTIAL_REFUND",
            resolutionOutcome: "partial_refund",
            refundCents: 5000,
          }),
        })
      );
    });
  });
});
