import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  referralCode: { findUnique: vi.fn() },
  user: { findFirst: vi.fn() },
  referral: { count: vi.fn() },
  $transaction: vi.fn((ops: unknown[]) => Promise.all(ops as Promise<unknown>[])),
}));

vi.mock("@/src/services/analytics", () => ({
  trackEvent: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/referrals", () => ({
  createReferralIfNeeded: vi.fn(),
}));

vi.mock("@/lib/db/legacy", () => ({
  getLegacyDB: () => mockPrisma,
}));

import { trackEvent } from "@/src/services/analytics";
import { createReferralIfNeeded } from "@/lib/referrals";
import { trackReferral } from "../referral";

describe("trackReferral", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ignores self-referral", async () => {
    mockPrisma.referralCode.findUnique.mockResolvedValue({ code: "REF-ABC", ownerUserId: "u1" });
    const r = await trackReferral("REF-ABC", "u1");
    expect(r.applied).toBe(false);
    expect(vi.mocked(createReferralIfNeeded)).not.toHaveBeenCalled();
  });

  it("does not double-count the same referee", async () => {
    mockPrisma.referralCode.findUnique.mockResolvedValue({ code: "REF-ABC", ownerUserId: "owner1" });
    mockPrisma.referral.count
      .mockResolvedValueOnce(0) // todays (rate limit)
      .mockResolvedValueOnce(1) // existingPair
      .mockResolvedValueOnce(3); // total
    const r = await trackReferral("REF-ABC", "new1");
    expect(r.applied).toBe(false);
    expect(vi.mocked(createReferralIfNeeded)).not.toHaveBeenCalled();
  });

  it("applies and fires reward event when threshold reached", async () => {
    mockPrisma.referralCode.findUnique.mockResolvedValue({ code: "REF-ABC", ownerUserId: "owner1" });
    mockPrisma.referral.count
      .mockResolvedValueOnce(0) // todays
      .mockResolvedValueOnce(0) // existingPair
      .mockResolvedValueOnce(5); // total successes for owner
    vi.mocked(createReferralIfNeeded).mockResolvedValue({ id: "r1" } as never);
    const r = await trackReferral("REF-ABC", "new1");
    expect(r.applied).toBe(true);
    expect(r.rewardTriggered).toBe(true);
    expect(vi.mocked(trackEvent)).toHaveBeenCalledWith(
      "referral_reward_eligible",
      expect.objectContaining({ ownerUserId: "owner1" }),
      expect.anything()
    );
  });
});
