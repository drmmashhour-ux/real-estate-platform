import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  evaluateGuestCheckout,
  evaluateListingForNewBooking,
} from "@/lib/bnhub/bnhub-safety-rules";

const baseListing = {
  id: "l1",
  verificationStatus: "VERIFIED" as const,
  listingStatus: "PUBLISHED" as const,
  securityDepositCents: 10_000,
  nightPriceCents: 50_000,
};

describe("bnhub-safety-rules", () => {
  beforeEach(() => {
    vi.stubEnv("BNHUB_TRUST_STRICT", "");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("allows booking when not strict and unverified", () => {
    const r = evaluateListingForNewBooking(
      { ...baseListing, verificationStatus: "PENDING" },
      null
    );
    expect(r.ok).toBe(true);
  });

  it("blocks when strict and unverified", () => {
    vi.stubEnv("BNHUB_TRUST_STRICT", "1");
    const r = evaluateListingForNewBooking(
      { ...baseListing, verificationStatus: "PENDING" },
      null
    );
    expect(r.ok).toBe(false);
  });

  it("checkout blocks risky listing without deposit", () => {
    const r = evaluateGuestCheckout(
      { verificationStatus: "VERIFIED", securityDepositCents: 0 },
      { fraudScore: 60 }
    );
    expect(r.ok).toBe(false);
  });
});
