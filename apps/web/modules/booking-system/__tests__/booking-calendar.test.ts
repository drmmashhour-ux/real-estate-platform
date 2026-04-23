import { describe, expect, it, vi, beforeAll, afterAll } from "vitest";
import { formatSlotListForMessage, groupSlotsForUi } from "../booking-calendar.service";

describe("groupSlotsForUi", () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-23T12:00:00.000Z"));
  });
  afterAll(() => {
    vi.useRealTimers();
  });

  it("groups a few concrete slots for UI copy", () => {
    const rows = groupSlotsForUi(
      [
        { start: "2026-04-23T22:00:00.000Z", end: "2026-04-23T22:45:00.000Z" },
        { start: "2026-04-24T14:30:00.000Z", end: "2026-04-24T15:15:00.000Z" },
        { start: "2026-04-25T18:00:00.000Z", end: "2026-04-25T18:45:00.000Z" },
      ],
      "America/Toronto",
    );
    expect(rows.length).toBe(3);
    expect(rows[0].relativeLabel).toBe("Today");
    expect(formatSlotListForMessage(rows).includes("Today")).toBe(true);
  });
});

describe("formatSlotListForMessage", () => {
  it("emits one bullet per line", () => {
    const t = formatSlotListForMessage([
      {
        startIso: "",
        endIso: "",
        dayLabel: "",
        timeLabel: "6:00 PM",
        relativeLabel: "Today",
      },
    ]);
    expect(t).toBe("• Today 6:00 PM");
  });
});
