import { describe, it, expect, afterEach } from "vitest";
import {
  bnhubBookingFeeSplitCents,
  bnhubFeeSplitIsValid,
  bnhubStripeApplicationFeeCents,
  BNHUB_COMMISSION_RATE_DEFAULT,
} from "./bnhub-connect";

describe("bnhubBookingFeeSplitCents", () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
  });

  it("defaults to 15% platform fee", () => {
    delete process.env.BNHUB_COMMISSION_RATE;
    delete process.env.BNHUB_PLATFORM_COMMISSION_RATE;
    const s = bnhubBookingFeeSplitCents(10_000);
    expect(s.totalAmountCents).toBe(10_000);
    expect(s.platformFeeCents).toBe(1500);
    expect(s.hostPayoutCents).toBe(8500);
    expect(bnhubFeeSplitIsValid(s)).toBe(true);
  });

  it("respects BNHUB_COMMISSION_RATE", () => {
    process.env.BNHUB_COMMISSION_RATE = "0.1";
    const s = bnhubBookingFeeSplitCents(1000);
    expect(s.platformFeeCents).toBe(100);
    expect(s.hostPayoutCents).toBe(900);
    expect(s.platformFeeCents + s.hostPayoutCents).toBe(s.totalAmountCents);
  });

  it("has no negative parts", () => {
    delete process.env.BNHUB_COMMISSION_RATE;
    const s = bnhubBookingFeeSplitCents(1);
    expect(s.platformFeeCents).toBeGreaterThanOrEqual(0);
    expect(s.hostPayoutCents).toBeGreaterThanOrEqual(0);
    expect(bnhubFeeSplitIsValid(s)).toBe(true);
  });

  it("uses Math.round for platform fee (auditable)", () => {
    delete process.env.BNHUB_COMMISSION_RATE;
    const s = bnhubBookingFeeSplitCents(33);
    expect(s.platformFeeCents).toBe(Math.round(33 * BNHUB_COMMISSION_RATE_DEFAULT));
    expect(s.hostPayoutCents).toBe(33 - s.platformFeeCents);
  });
});

describe("bnhubStripeApplicationFeeCents", () => {
  const env = { ...process.env };

  afterEach(() => {
    process.env = { ...env };
  });

  it("matches split platform fee at 15%", () => {
    delete process.env.BNHUB_COMMISSION_RATE;
    expect(bnhubStripeApplicationFeeCents(2500)).toBe(375);
  });

  it("allows zero fee when rounded platform is 0", () => {
    delete process.env.BNHUB_COMMISSION_RATE;
    expect(bnhubStripeApplicationFeeCents(2)).toBe(0);
  });
});
