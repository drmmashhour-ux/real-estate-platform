import { describe, expect, it } from "vitest";
import { generateLaunchDailyReport } from "../generateLaunchDailyReport";
import type { LaunchDailyRow } from "../metrics";
import { sumLaunchSeries } from "../service";
import { toUtcDateOnly } from "../utc-day";

function row(partial: Partial<LaunchDailyRow> & { date: string }): LaunchDailyRow {
  return {
    messagesSent: 0,
    repliesReceived: 0,
    demosBooked: 0,
    demosCompleted: 0,
    usersCreated: 0,
    activatedUsers: 0,
    payingUsers: 0,
    postsCreated: 0,
    contentViews: 0,
    contentClicks: 0,
    contentConversions: 0,
    ...partial,
  };
}

describe("sumLaunchSeries", () => {
  it("sums all keys across days", () => {
    const totals = sumLaunchSeries([
      row({ date: "2026-03-01", messagesSent: 2, contentViews: 10 }),
      row({ date: "2026-03-02", messagesSent: 3, contentViews: 5 }),
    ]);
    expect(totals.messagesSent).toBe(5);
    expect(totals.contentViews).toBe(15);
  });
});

describe("generateLaunchDailyReport", () => {
  it("suggests logging when empty", () => {
    const r = generateLaunchDailyReport([]);
    expect(r.improve.length).toBeGreaterThan(0);
    expect(r.improve[0]).toMatch(/Start logging/i);
  });

  it("flags more messages with fewer replies week over week", () => {
    const series: LaunchDailyRow[] = [];
    for (let i = 0; i < 7; i++) {
      series.push(row({ date: `2026-03-0${i + 1}`, messagesSent: 10, repliesReceived: 5 }));
    }
    for (let i = 0; i < 7; i++) {
      series.push(
        row({
          date: `2026-03-${10 + i}`,
          messagesSent: 20,
          repliesReceived: 2,
        }),
      );
    }
    const r = generateLaunchDailyReport(series);
    expect(r.didnt.some((s) => /fewer replies/i.test(s))).toBe(true);
  });

  it("praises higher demo completions in last 7 vs prior 7", () => {
    const series: LaunchDailyRow[] = [];
    for (let i = 0; i < 7; i++) {
      series.push(row({ date: `2026-04-0${i + 1}`, demosCompleted: 1 }));
    }
    for (let i = 0; i < 7; i++) {
      series.push(row({ date: `2026-04-${10 + i}`, demosCompleted: 3 }));
    }
    const r = generateLaunchDailyReport(series);
    expect(r.worked.some((s) => /demos completed/i.test(s))).toBe(true);
  });
});

describe("toUtcDateOnly", () => {
  it("strips time in UTC", () => {
    const d = new Date("2026-06-15T22:00:00.000Z");
    const u = toUtcDateOnly(d);
    expect(u.toISOString().slice(0, 10)).toBe("2026-06-15");
  });
});
