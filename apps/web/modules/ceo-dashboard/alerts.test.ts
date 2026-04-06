import { describe, expect, it } from "vitest";
import { deriveCeoAlerts } from "./alerts";

describe("deriveCeoAlerts", () => {
  it("flags traffic drop when prior baseline is high", () => {
    const a = deriveCeoAlerts({
      trafficEvents24h: 10,
      trafficEventsPrev24h: 40,
      bookingsToday: 2,
      hourUtc: 14,
      newLeads30d: 5,
      wonLeads30d: 0,
      pipelineConversionPct: null,
      bookings7d: 10,
      bookingsPrev7d: 10,
    });
    expect(a.some((x) => x.id === "activity_drop")).toBe(true);
  });

  it("flags no bookings today after noon UTC as info", () => {
    const a = deriveCeoAlerts({
      trafficEvents24h: 5,
      trafficEventsPrev24h: 5,
      bookingsToday: 0,
      hourUtc: 15,
      newLeads30d: 5,
      wonLeads30d: 0,
      pipelineConversionPct: null,
      bookings7d: 10,
      bookingsPrev7d: 10,
    });
    expect(a.some((x) => x.id === "no_bookings_today")).toBe(true);
  });

  it("flags low pipeline conversion when volume is high", () => {
    const a = deriveCeoAlerts({
      trafficEvents24h: 100,
      trafficEventsPrev24h: 100,
      bookingsToday: 3,
      hourUtc: 10,
      newLeads30d: 50,
      wonLeads30d: 0,
      pipelineConversionPct: 0,
      bookings7d: 10,
      bookingsPrev7d: 10,
    });
    expect(a.some((x) => x.id === "low_conversion")).toBe(true);
  });

  it("does not flag low conversion when lead volume is low", () => {
    const a = deriveCeoAlerts({
      trafficEvents24h: 10,
      trafficEventsPrev24h: 10,
      bookingsToday: 1,
      hourUtc: 10,
      newLeads30d: 10,
      wonLeads30d: 0,
      pipelineConversionPct: 0,
      bookings7d: 10,
      bookingsPrev7d: 10,
    });
    expect(a.some((x) => x.id === "low_conversion")).toBe(false);
  });
});
