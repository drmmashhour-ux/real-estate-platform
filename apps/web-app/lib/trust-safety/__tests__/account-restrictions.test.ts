/**
 * Tests for account restrictions – canUserPublishListing, canUserWithdraw, isUserRestrictedOrBanned.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  canUserPublishListing,
  canUserWithdraw,
  canUserCreateBooking,
  isUserRestrictedOrBanned,
} from "@/lib/trust-safety/account-restrictions";

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
  },
}));

const { prisma } = await import("@/lib/db");

describe("Account restrictions", () => {
  beforeEach(() => {
    vi.mocked(prisma.user.findUnique).mockReset();
  });

  describe("canUserPublishListing", () => {
    it("returns true when accountStatus is ACTIVE", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1", accountStatus: "ACTIVE" } as never);
      expect(await canUserPublishListing("u1")).toBe(true);
    });
    it("returns false when accountStatus is RESTRICTED", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1", accountStatus: "RESTRICTED" } as never);
      expect(await canUserPublishListing("u1")).toBe(false);
    });
    it("returns false when accountStatus is SUSPENDED or BANNED", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1", accountStatus: "SUSPENDED" } as never);
      expect(await canUserPublishListing("u1")).toBe(false);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1", accountStatus: "BANNED" } as never);
      expect(await canUserPublishListing("u1")).toBe(false);
    });
  });

  describe("canUserWithdraw", () => {
    it("returns true when ACTIVE", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1", accountStatus: "ACTIVE" } as never);
      expect(await canUserWithdraw("u1")).toBe(true);
    });
    it("returns false when RESTRICTED or BANNED", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1", accountStatus: "RESTRICTED" } as never);
      expect(await canUserWithdraw("u1")).toBe(false);
    });
  });

  describe("isUserRestrictedOrBanned", () => {
    it("returns true for RESTRICTED, SUSPENDED, BANNED", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1", accountStatus: "RESTRICTED" } as never);
      expect(await isUserRestrictedOrBanned("u1")).toBe(true);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1", accountStatus: "SUSPENDED" } as never);
      expect(await isUserRestrictedOrBanned("u1")).toBe(true);
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1", accountStatus: "BANNED" } as never);
      expect(await isUserRestrictedOrBanned("u1")).toBe(true);
    });
    it("returns false for ACTIVE", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1", accountStatus: "ACTIVE" } as never);
      expect(await isUserRestrictedOrBanned("u1")).toBe(false);
    });
  });

  describe("canUserCreateBooking", () => {
    it("returns true when ACTIVE", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u1", accountStatus: "ACTIVE" } as never);
      expect(await canUserCreateBooking("u1")).toBe(true);
    });
  });
});
