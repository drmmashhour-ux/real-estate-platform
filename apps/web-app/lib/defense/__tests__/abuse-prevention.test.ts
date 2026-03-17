/**
 * Tests for abuse prevention – isUserRestricted, offender profile.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { isUserRestricted, getOffenderProfile } from "@/lib/defense/abuse-prevention";

vi.mock("@/lib/db", () => ({
  prisma: {
    offenderProfile: { findUnique: vi.fn() },
    abuseSignal: { create: vi.fn() },
  },
}));

const { prisma } = await import("@/lib/db");

describe("Abuse prevention", () => {
  beforeEach(() => {
    vi.mocked(prisma.offenderProfile.findUnique).mockReset();
  });

  describe("isUserRestricted", () => {
    it("returns suspended true when profile has suspendedAt", async () => {
      vi.mocked(prisma.offenderProfile.findUnique).mockResolvedValue({
        id: "1",
        userId: "u1",
        strikeCount: 1,
        lastStrikeAt: new Date(),
        suspendedAt: new Date(),
        bannedAt: null,
        linkedAccountIds: [],
        notes: null,
        updatedAt: new Date(),
        createdAt: new Date(),
      });
      const r = await isUserRestricted("u1");
      expect(r.suspended).toBe(true);
      expect(r.banned).toBe(false);
    });

    it("returns banned true when profile has bannedAt", async () => {
      vi.mocked(prisma.offenderProfile.findUnique).mockResolvedValue({
        id: "1",
        userId: "u1",
        strikeCount: 2,
        lastStrikeAt: new Date(),
        suspendedAt: null,
        bannedAt: new Date(),
        linkedAccountIds: [],
        notes: null,
        updatedAt: new Date(),
        createdAt: new Date(),
      });
      const r = await isUserRestricted("u1");
      expect(r.suspended).toBe(false);
      expect(r.banned).toBe(true);
    });

    it("returns both false when no profile", async () => {
      vi.mocked(prisma.offenderProfile.findUnique).mockResolvedValue(null);
      const r = await isUserRestricted("u1");
      expect(r.suspended).toBe(false);
      expect(r.banned).toBe(false);
    });
  });

  describe("getOffenderProfile", () => {
    it("returns null when no profile", async () => {
      vi.mocked(prisma.offenderProfile.findUnique).mockResolvedValue(null);
      const p = await getOffenderProfile("u1");
      expect(p).toBeNull();
    });
  });
});
