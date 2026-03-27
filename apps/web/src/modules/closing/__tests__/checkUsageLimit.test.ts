import { describe, expect, it, vi, beforeEach } from "vitest";
import { checkUsageLimit } from "@/src/modules/closing/application/checkUsageLimit";

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock("@/src/modules/growth-funnel/application/checkGrowthPaywall", () => ({
  checkGrowthPaywall: vi.fn(),
}));

import { prisma } from "@/lib/db";
import { checkGrowthPaywall } from "@/src/modules/growth-funnel/application/checkGrowthPaywall";

describe("checkUsageLimit", () => {
  beforeEach(() => {
    vi.mocked(prisma.user.findUnique).mockReset();
    vi.mocked(checkGrowthPaywall).mockReset();
  });

  it("blocks negotiation for free plan", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: "free", role: "USER" } as never);
    const r = await checkUsageLimit("u1", "negotiation");
    expect(r.limitReached).toBe(true);
    expect(r.allowed).toBe(false);
  });

  it("allows negotiation for pro", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: "pro", role: "USER" } as never);
    const r = await checkUsageLimit("u1", "negotiation");
    expect(r.allowed).toBe(true);
    expect(r.limitReached).toBe(false);
  });

  it("delegates simulator to growth paywall", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ plan: "free", role: "USER" } as never);
    vi.mocked(checkGrowthPaywall).mockResolvedValue({ allowed: true, remaining: 2, limit: 3 });
    const r = await checkUsageLimit("u1", "simulator");
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(2);
    expect(r.limitReached).toBe(false);
  });
});
