import { describe, expect, it } from "vitest";
import { shouldSkipExecutiveScheduleRun } from "../report-scheduler.service";

/** Mirrors `ExecutiveReportScheduleFrequency.MONTHLY` at runtime when Prisma client is generated. */
const MONTHLY = "MONTHLY" as const;

describe("shouldSkipExecutiveScheduleRun", () => {
  const now = new Date("2026-04-23T12:00:00.000Z");

  it("does not skip when lastRunAt is null", () => {
    expect(shouldSkipExecutiveScheduleRun(MONTHLY, null, now)).toBe(false);
  });

  it("skips when lastRunAt falls in the current monthly UTC window", () => {
    const lastRunAt = new Date("2026-04-10T00:00:00.000Z");
    expect(shouldSkipExecutiveScheduleRun(MONTHLY, lastRunAt, now)).toBe(true);
  });

  it("does not skip when lastRunAt is before the monthly window", () => {
    const lastRunAt = new Date("2026-03-28T00:00:00.000Z");
    expect(shouldSkipExecutiveScheduleRun(MONTHLY, lastRunAt, now)).toBe(false);
  });
});
