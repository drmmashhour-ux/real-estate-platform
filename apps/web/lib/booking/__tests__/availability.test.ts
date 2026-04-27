import { describe, expect, it } from "vitest";

import {
  availabilityUrgencyMessage,
  firstAvailableNightFrom,
  getAvailabilityUrgencyLabel,
  mergeBookingIntervals,
} from "@/lib/booking/availability-core";

describe("availability urgency (Order A.1 — real data only)", () => {
  it("no label at or below 0.7", () => {
    expect(getAvailabilityUrgencyLabel(0.7)).toBeNull();
    expect(availabilityUrgencyMessage(0.5)).toBeNull();
  });
  it("high demand only above 0.7", () => {
    expect(getAvailabilityUrgencyLabel(0.71)).toBe("high_demand");
  });
  it("almost fully booked only above 0.9", () => {
    expect(getAvailabilityUrgencyLabel(0.91)).toBe("almost_full");
  });
  it("0.9 does not show almost_full", () => {
    expect(getAvailabilityUrgencyLabel(0.9)).toBe("high_demand");
  });
});

describe("next available night (merge)", () => {
  it("no bookings → first night is from-day", () => {
    const merged = mergeBookingIntervals([]);
    const from = new Date(Date.UTC(2026, 3, 26));
    expect(firstAvailableNightFrom(merged, from)?.toISOString().slice(0, 10)).toBe("2026-04-26");
  });
  it("one block covers from-day → first gap after", () => {
    const merged = mergeBookingIntervals([
      { checkIn: new Date(Date.UTC(2026, 3, 26)), checkOut: new Date(Date.UTC(2026, 3, 30)) },
    ]);
    const from = new Date(Date.UTC(2026, 3, 26));
    expect(firstAvailableNightFrom(merged, from)?.toISOString().slice(0, 10)).toBe("2026-04-30");
  });
  it("gap between two stays yields next day after first checkout", () => {
    const merged = mergeBookingIntervals([
      { checkIn: new Date(Date.UTC(2026, 3, 10)), checkOut: new Date(Date.UTC(2026, 3, 15)) },
      { checkIn: new Date(Date.UTC(2026, 3, 20)), checkOut: new Date(Date.UTC(2026, 3, 25)) },
    ]);
    const from = new Date(Date.UTC(2026, 3, 10));
    expect(firstAvailableNightFrom(merged, from)?.toISOString().slice(0, 10)).toBe("2026-04-15");
  });
});
