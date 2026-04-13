import { describe, expect, it } from "vitest";
import {
  addBookingPlatformFeesToStreams,
  foldPaidPlatformPaymentsIntoStreams,
  MANAGEMENT_HUB_BOOKING_CHECKOUT_PAYMENT_TYPE,
  streamTotal,
} from "./management-hub-payment-streams";

describe("management-hub payment streams (money-in product lines)", () => {
  it("classifies lead payment types into leadsCents", () => {
    const s = foldPaidPlatformPaymentsIntoStreams([
      { paymentType: "listing_contact_lead", amountCents: 5_000 },
      { paymentType: "lead_marketplace", amountCents: 12_000 },
      { paymentType: "mortgage_contact_unlock", amountCents: 3_000 },
    ]);
    const full = addBookingPlatformFeesToStreams(s, 0);
    expect(full.leadsCents).toBe(20_000);
    expect(full.featuredCents).toBe(0);
    expect(full.otherCents).toBe(0);
    expect(full.bookingsCents).toBe(0);
    expect(full.totalCents).toBe(20_000);
  });

  it("classifies featured_listing into featuredCents", () => {
    const s = foldPaidPlatformPaymentsIntoStreams([{ paymentType: "featured_listing", amountCents: 9_900 }]);
    const full = addBookingPlatformFeesToStreams(s, 0);
    expect(full.featuredCents).toBe(9_900);
    expect(streamTotal(full)).toBe(full.totalCents);
  });

  it("puts subscription and other monetization into otherCents", () => {
    const s = foldPaidPlatformPaymentsIntoStreams([
      { paymentType: "subscription", amountCents: 49_00 },
      { paymentType: "fsbo_publish", amountCents: 99_00 },
    ]);
    const full = addBookingPlatformFeesToStreams(s, 0);
    expect(full.leadsCents).toBe(0);
    expect(full.otherCents).toBe(49_00 + 99_00);
    expect(full.totalCents).toBe(49_00 + 99_00);
  });

  it("skips booking checkout rows in PlatformPayment fold (fees come from Payment aggregate)", () => {
    const s = foldPaidPlatformPaymentsIntoStreams([
      { paymentType: MANAGEMENT_HUB_BOOKING_CHECKOUT_PAYMENT_TYPE, amountCents: 400_00 },
      { paymentType: "listing_contact_lead", amountCents: 25_00 },
    ]);
    expect(s.leadsCents).toBe(25_00);
    expect(s.otherCents).toBe(0);
    const full = addBookingPlatformFeesToStreams(s, 48_00);
    expect(full.bookingsCents).toBe(48_00);
    expect(full.totalCents).toBe(25_00 + 48_00);
  });

  it("adds BNHub platform fees into bookingsCents and total", () => {
    const base = foldPaidPlatformPaymentsIntoStreams([{ paymentType: "lead_unlock", amountCents: 10_00 }]);
    const full = addBookingPlatformFeesToStreams(base, 15_50);
    expect(full.leadsCents).toBe(10_00);
    expect(full.bookingsCents).toBe(15_50);
    expect(full.totalCents).toBe(25_50);
  });

  it("daily income view = sum of all streams (matches admin Total checkout card)", () => {
    const full = addBookingPlatformFeesToStreams(
      foldPaidPlatformPaymentsIntoStreams([
        { paymentType: "listing_contact_lead", amountCents: 100_00 },
        { paymentType: "featured_listing", amountCents: 50_00 },
        { paymentType: "subscription", amountCents: 29_99 },
      ]),
      12_34
    );
    expect(full.totalCents).toBe(100_00 + 50_00 + 29_99 + 12_34);
    expect(streamTotal(full)).toBe(full.totalCents);
  });
});
