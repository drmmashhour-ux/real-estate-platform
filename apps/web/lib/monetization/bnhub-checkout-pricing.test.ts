import { describe, expect, it } from "vitest";
import {
  computeBnhubGuestCheckoutCents,
  countPeakNightsFromBookingDates,
} from "@/lib/monetization/bnhub-checkout-pricing";

describe("countPeakNightsFromBookingDates", () => {
  it("counts Fri/Sat/Sun in UTC", () => {
    const { peakNights, totalNights } = countPeakNightsFromBookingDates(["2026-07-03", "2026-07-04", "2026-07-05"]);
    expect(totalNights).toBe(3);
    expect(peakNights).toBeGreaterThanOrEqual(1);
  });
});

describe("computeBnhubGuestCheckoutCents", () => {
  it("adds base fee and upsells", () => {
    const prevBase = process.env.BNHUB_SERVICE_FEE_BASE_BPS;
    const prevPeak = process.env.BNHUB_SERVICE_FEE_PEAK_EXTRA_BPS;
    const prevIns = process.env.BNHUB_UPSELL_INSURANCE_CENTS;
    process.env.BNHUB_SERVICE_FEE_BASE_BPS = "1000";
    process.env.BNHUB_SERVICE_FEE_PEAK_EXTRA_BPS = "0";
    process.env.BNHUB_UPSELL_INSURANCE_CENTS = "1000";
    try {
      const r = computeBnhubGuestCheckoutCents({
        accommodationCents: 10000,
        dates: ["2026-07-01"],
        upsells: { insurance: true },
      });
      expect(r.baseFeeCents).toBe(1000);
      expect(r.upsellCents.insurance).toBe(1000);
      expect(r.totalCents).toBe(12000);
    } finally {
      if (prevBase === undefined) delete process.env.BNHUB_SERVICE_FEE_BASE_BPS;
      else process.env.BNHUB_SERVICE_FEE_BASE_BPS = prevBase;
      if (prevPeak === undefined) delete process.env.BNHUB_SERVICE_FEE_PEAK_EXTRA_BPS;
      else process.env.BNHUB_SERVICE_FEE_PEAK_EXTRA_BPS = prevPeak;
      if (prevIns === undefined) delete process.env.BNHUB_UPSELL_INSURANCE_CENTS;
      else process.env.BNHUB_UPSELL_INSURANCE_CENTS = prevIns;
    }
  });
});
