import { describe, expect, it, vi, beforeEach } from "vitest";
import { normalizeSignupRefParam, computeViralCoefficientForReferrer } from "./viral";

vi.mock("@/lib/db", () => ({
  prisma: {
    referralEvent: { count: vi.fn() },
  },
}));

describe("normalizeSignupRefParam", () => {
  it("preserves cuid-like refs (invite links)", () => {
    const id = "clh8x9y2z0000abcdef1234567";
    expect(normalizeSignupRefParam(id)).toBe(id);
  });

  it("uppercases referral codes", () => {
    expect(normalizeSignupRefParam("userabc12")).toBe("USERABC12");
  });
});

describe("computeViralCoefficientForReferrer", () => {
  beforeEach(async () => {
    const db = await import("@/lib/db");
    vi.mocked(db.prisma.referralEvent.count).mockReset();
  });

  it("returns zeroes when no codes", async () => {
    const r = await computeViralCoefficientForReferrer([]);
    expect(r).toEqual({ invitesSent: 0, signups: 0, conversions: 0, viralCoefficient: 0 });
  });

  it("computes K = signups / max(1, invites)", async () => {
    const db = await import("@/lib/db");
    vi.mocked(db.prisma.referralEvent.count).mockImplementation(async ({ where }: { where: { eventType: string } }) => {
      if (where.eventType === "invite_sent") return 10;
      if (where.eventType === "signup") return 4;
      if (where.eventType === "paid") return 2;
      return 0;
    });
    const r = await computeViralCoefficientForReferrer(["USER1"]);
    expect(r.invitesSent).toBe(10);
    expect(r.signups).toBe(4);
    expect(r.conversions).toBe(2);
    expect(r.viralCoefficient).toBeCloseTo(0.4);
  });
});
