/**
 * Run: npx vitest run lib/bnhub/__tests__/booking-revenue-pricing.test.ts
 */
import { describe, it, expect, afterEach, vi } from "vitest";
import {
  calculateBookingTotal,
  calculateBookingTotalCents,
  resolveBnhubPlatformGuestFeePercent,
} from "../booking-revenue-pricing";

describe("booking-revenue-pricing", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("calculateBookingTotalCents applies clamped platform fee to lodging + extras + upsells", () => {
    vi.stubEnv("BNHUB_PLATFORM_FEE_PERCENT", "12");
    const b = calculateBookingTotalCents(10000, 2, { extrasCents: 5000, upsells: { earlyCheckIn: true } });
    expect(b.extrasCents).toBe(5000);
    expect(b.upsellsCents).toBeGreaterThan(0);
    const lodging = 20000;
    expect(b.baseAmountCents).toBe(lodging + 5000 + b.upsellsCents);
    expect(b.serviceFeePercent).toBe(12);
    expect(b.serviceFeeCents).toBe(Math.round((b.baseAmountCents * 12) / 100));
    expect(b.totalCents).toBe(b.baseAmountCents + b.serviceFeeCents);
    expect(b.hostReceivesCents).toBe(b.baseAmountCents);
  });

  it("clamps BNHUB_PLATFORM_FEE_PERCENT to 10–15", () => {
    vi.stubEnv("BNHUB_PLATFORM_FEE_PERCENT", "99");
    expect(resolveBnhubPlatformGuestFeePercent()).toBe(15);
    vi.stubEnv("BNHUB_PLATFORM_FEE_PERCENT", "1");
    expect(resolveBnhubPlatformGuestFeePercent()).toBe(10);
  });

  it("calculateBookingTotal returns dollar floats", () => {
    vi.stubEnv("BNHUB_PLATFORM_FEE_PERCENT", "12");
    const d = calculateBookingTotal(100, 3, { extras: 25 });
    expect(d.baseAmount).toBeCloseTo(325, 5);
    expect(d.serviceFee).toBeCloseTo(39, 5);
    expect(d.total).toBeCloseTo(364, 5);
    expect(d.hostReceives).toBeCloseTo(325, 5);
  });
});
