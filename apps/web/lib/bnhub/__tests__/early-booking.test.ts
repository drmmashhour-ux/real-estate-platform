import { describe, it, expect } from "vitest";
import { earlyBookingHintForLeadDays, nightsUntilCheckInUtc } from "../early-booking";

describe("nightsUntilCheckInUtc", () => {
  it("returns null for invalid date", () => {
    expect(nightsUntilCheckInUtc("")).toBeNull();
    expect(nightsUntilCheckInUtc("bad")).toBeNull();
  });

  it("counts days from UTC midnight", () => {
    const now = new Date(Date.UTC(2026, 5, 10, 15, 0, 0));
    expect(nightsUntilCheckInUtc("2026-06-20", now)).toBe(10);
  });
});

describe("earlyBookingHintForLeadDays", () => {
  it("returns null when lead is short", () => {
    expect(earlyBookingHintForLeadDays(5)).toBeNull();
    expect(earlyBookingHintForLeadDays(13)).toBeNull();
  });

  it("returns hint for two-week horizon", () => {
    const h = earlyBookingHintForLeadDays(14);
    expect(h?.title).toBeTruthy();
    expect(h?.body).toContain("two weeks");
  });

  it("escalates copy for long horizons", () => {
    const h = earlyBookingHintForLeadDays(70);
    expect(h?.title).toBe("Early booking");
    expect(h?.body).toContain("70");
  });
});
