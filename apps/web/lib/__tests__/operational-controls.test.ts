/**
 * Unit tests for operational control layer: feature flags and control checks.
 * Mocks Prisma to avoid DB in CI.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isFeatureEnabled,
  isControlActive,
  isBookingRestrictedFor,
  isPayoutHeldFor,
} from "@/lib/operational-controls";

vi.mock("@/lib/db", () => ({
  prisma: {
    featureFlag: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      create: vi.fn(),
    },
    operationalControl: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    controlActionAuditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

const { prisma } = await import("@/lib/db");

describe("Operational controls", () => {
  beforeEach(() => {
    vi.mocked(prisma.featureFlag.findUnique).mockReset();
    vi.mocked(prisma.operationalControl.findMany).mockReset();
  });

  describe("isFeatureEnabled", () => {
    it("returns false when flag does not exist", async () => {
      vi.mocked(prisma.featureFlag.findUnique).mockResolvedValue(null);
      expect(await isFeatureEnabled("unknown")).toBe(false);
    });

    it("returns false when flag exists but enabled is false", async () => {
      vi.mocked(prisma.featureFlag.findUnique).mockResolvedValue({
        id: "1",
        key: "instant_booking",
        enabled: false,
        scope: "GLOBAL",
        scopeValue: null,
        reason: null,
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(await isFeatureEnabled("instant_booking")).toBe(false);
    });

    it("returns true when flag is GLOBAL and enabled", async () => {
      vi.mocked(prisma.featureFlag.findUnique).mockResolvedValue({
        id: "1",
        key: "instant_booking",
        enabled: true,
        scope: "GLOBAL",
        scopeValue: null,
        reason: null,
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(await isFeatureEnabled("instant_booking")).toBe(true);
      expect(await isFeatureEnabled("instant_booking", { region: "NYC" })).toBe(true);
    });

    it("returns true for REGION scope when region matches", async () => {
      vi.mocked(prisma.featureFlag.findUnique).mockResolvedValue({
        id: "1",
        key: "instant_booking",
        enabled: true,
        scope: "REGION",
        scopeValue: "NYC",
        reason: null,
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(await isFeatureEnabled("instant_booking", { region: "NYC" })).toBe(true);
    });

    it("returns false for REGION scope when region does not match", async () => {
      vi.mocked(prisma.featureFlag.findUnique).mockResolvedValue({
        id: "1",
        key: "instant_booking",
        enabled: true,
        scope: "REGION",
        scopeValue: "NYC",
        reason: null,
        updatedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      expect(await isFeatureEnabled("instant_booking", { region: "LA" })).toBe(false);
    });
  });

  describe("isControlActive", () => {
    it("returns true when a GLOBAL BOOKING_RESTRICTION exists", async () => {
      vi.mocked(prisma.operationalControl.findMany).mockResolvedValue([
        {
          id: "1",
          controlType: "BOOKING_RESTRICTION",
          targetType: "GLOBAL",
          targetId: null,
          payload: null,
          active: true,
          reason: null,
          reasonCode: null,
          createdBy: null,
          expiresAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      expect(
        await isControlActive("BOOKING_RESTRICTION", { targetType: "LISTING", targetId: "L1", region: "NYC" })
      ).toBe(true);
    });

    it("returns false when no matching control exists", async () => {
      vi.mocked(prisma.operationalControl.findMany).mockResolvedValue([]);
      expect(
        await isControlActive("BOOKING_RESTRICTION", { targetType: "LISTING", targetId: "L1", region: "NYC" })
      ).toBe(false);
    });

    it("returns true when REGION control matches region", async () => {
      vi.mocked(prisma.operationalControl.findMany).mockResolvedValue([
        {
          id: "1",
          controlType: "PAYOUT_HOLD",
          targetType: "REGION",
          targetId: "NYC",
          payload: null,
          active: true,
          reason: null,
          reasonCode: null,
          createdBy: null,
          expiresAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      expect(await isControlActive("PAYOUT_HOLD", { targetType: "USER", targetId: "U1", region: "NYC" })).toBe(true);
    });
  });

  describe("isBookingRestrictedFor", () => {
    it("returns true when BOOKING_RESTRICTION is active for listing region", async () => {
      vi.mocked(prisma.operationalControl.findMany).mockResolvedValue([
        {
          id: "1",
          controlType: "BOOKING_RESTRICTION",
          targetType: "REGION",
          targetId: "NYC",
          payload: null,
          active: true,
          reason: null,
          reasonCode: null,
          createdBy: null,
          expiresAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      expect(await isBookingRestrictedFor({ listingId: "L1", region: "NYC" })).toBe(true);
    });

    it("returns false when no booking restriction", async () => {
      vi.mocked(prisma.operationalControl.findMany).mockResolvedValue([]);
      expect(await isBookingRestrictedFor({ listingId: "L1", region: "NYC" })).toBe(false);
    });
  });

  describe("isPayoutHeldFor", () => {
    it("returns true when PAYOUT_HOLD is active for user region", async () => {
      vi.mocked(prisma.operationalControl.findMany).mockResolvedValue([
        {
          id: "1",
          controlType: "PAYOUT_HOLD",
          targetType: "REGION",
          targetId: "NYC",
          payload: null,
          active: true,
          reason: null,
          reasonCode: null,
          createdBy: null,
          expiresAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);
      expect(await isPayoutHeldFor({ userId: "U1", region: "NYC" })).toBe(true);
    });
  });
});
