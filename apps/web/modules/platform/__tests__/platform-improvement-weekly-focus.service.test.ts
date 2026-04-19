import { describe, expect, it } from "vitest";
import { getUtcIsoWeekKey } from "../platform-improvement-weekly-focus.service";

describe("platform-improvement-weekly-focus", () => {
  it("getUtcIsoWeekKey returns stable YYYY-Www", () => {
    expect(getUtcIsoWeekKey(new Date("2026-01-07T12:00:00.000Z"))).toMatch(/^\d{4}-W\d{2}$/);
  });
});
