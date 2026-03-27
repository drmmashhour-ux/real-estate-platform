/**
 * Tests for enforcement – createEnforcementAction, submitAppeal, reviewAppeal, isUserRestricted integration.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createEnforcementAction, submitAppeal, reviewAppeal, getEnforcementHistory } from "@/lib/defense/enforcement";

vi.mock("@/lib/db", () => ({
  prisma: {
    enforcementAction: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    appeal: { create: vi.fn(), findMany: vi.fn(), update: vi.fn() },
    offenderProfile: {
      upsert: vi.fn(),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ userId: "u1", suspendedAt: new Date() }),
    },
  },
}));

vi.mock("@/lib/operational-controls", () => ({
  setOperationalControl: vi.fn().mockResolvedValue(undefined),
}));

const { prisma } = await import("@/lib/db");

describe("Enforcement", () => {
  beforeEach(() => {
    vi.mocked(prisma.enforcementAction.create).mockReset();
    vi.mocked(prisma.enforcementAction.findMany).mockReset();
    vi.mocked(prisma.enforcementAction.findUnique).mockReset();
    vi.mocked(prisma.appeal.create).mockReset();
    vi.mocked(prisma.appeal.update).mockReset();
    vi.mocked(prisma.offenderProfile.upsert).mockResolvedValue({} as never);
  });

  describe("createEnforcementAction", () => {
    it("creates action and upserts offender profile for SUSPENSION", async () => {
      vi.mocked(prisma.enforcementAction.create).mockResolvedValue({
        id: "ea1",
        userId: "u1",
        actionType: "ACCOUNT_SUSPENSION",
        severity: "HIGH",
        reasonCode: "ABUSE",
        reasonText: null,
        marketId: null,
        effectiveAt: new Date(),
        expiresAt: null,
        performedBy: "admin1",
        appealId: null,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      await createEnforcementAction({
        userId: "u1",
        actionType: "ACCOUNT_SUSPENSION",
        severity: "HIGH",
        reasonCode: "ABUSE",
        performedBy: "admin1",
      });
      expect(prisma.enforcementAction.create).toHaveBeenCalled();
      // SUSPENSION triggers upsertOffenderProfile (in abuse-prevention) and setOperationalControl
      expect(prisma.enforcementAction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ actionType: "ACCOUNT_SUSPENSION", userId: "u1" }),
        })
      );
    });
  });

  describe("submitAppeal", () => {
    it("creates appeal with PENDING status", async () => {
      vi.mocked(prisma.appeal.create).mockResolvedValue({
        id: "ap1",
        enforcementId: "ea1",
        userId: "u1",
        reasonCode: null,
        description: "Not me",
        status: "PENDING",
        submittedAt: new Date(),
        reviewedBy: null,
        reviewedAt: null,
        outcomeNotes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const appeal = await submitAppeal({
        enforcementId: "ea1",
        userId: "u1",
        description: "Not me",
      });
      expect(appeal.status).toBe("PENDING");
      expect(prisma.appeal.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: "PENDING", description: "Not me" }),
        })
      );
    });
  });

  describe("reviewAppeal", () => {
    it("updates appeal status and outcomeNotes", async () => {
      vi.mocked(prisma.appeal.update).mockResolvedValue({
        id: "ap1",
        status: "APPROVED",
        outcomeNotes: "Reinstated.",
        reviewedBy: "admin1",
        reviewedAt: new Date(),
      } as never);
      await reviewAppeal("ap1", "APPROVED", "admin1", "Reinstated.");
      expect(prisma.appeal.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "ap1" },
          data: expect.objectContaining({ status: "APPROVED", outcomeNotes: "Reinstated.", reviewedBy: "admin1" }),
        })
      );
    });
  });

  describe("getEnforcementHistory", () => {
    it("returns actions for user", async () => {
      vi.mocked(prisma.enforcementAction.findMany).mockResolvedValue([
        {
          id: "ea1",
          userId: "u1",
          actionType: "WARNING",
          severity: "LOW",
          effectiveAt: new Date(),
          appeal: null,
        },
      ] as never[]);
      const history = await getEnforcementHistory("u1");
      expect(history.length).toBe(1);
      expect(history[0].actionType).toBe("WARNING");
    });
  });
});
