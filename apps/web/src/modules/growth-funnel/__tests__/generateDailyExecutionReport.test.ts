import { describe, expect, it } from "vitest";
import { generateDailyExecutionReport } from "@/src/modules/growth-funnel/application/generateDailyExecutionReport";

describe("generateDailyExecutionReport", () => {
  it("lists improvements and regressions", () => {
    const r = generateDailyExecutionReport({
      current: {
        newUsers: 12,
        simulatorRuns: 40,
        activationRate: 35,
        retentionRate: 22,
        conversionRate: 10,
      },
      previous: {
        newUsers: 10,
        simulatorRuns: 30,
        activationRate: 30,
        retentionRate: 25,
        conversionRate: 12,
      },
      alerts: [],
    });
    expect(r.whatWorked.some((x) => x.includes("New users"))).toBe(true);
    expect(r.whatWorked.some((x) => x.includes("Activation"))).toBe(true);
    expect(r.whatDidnt.some((x) => x.includes("Retention"))).toBe(true);
    expect(r.whatDidnt.some((x) => x.includes("Upgrade conversion"))).toBe(true);
    expect(r.whatToImprove.length).toBeGreaterThan(0);
  });

  it("includes alert copy in whatToImprove", () => {
    const r = generateDailyExecutionReport({
      current: { newUsers: 1, simulatorRuns: 1, activationRate: 1, retentionRate: 1, conversionRate: 1 },
      previous: { newUsers: 1, simulatorRuns: 1, activationRate: 1, retentionRate: 1, conversionRate: 1 },
      alerts: [
        {
          metric: "activation",
          severity: "warning" as const,
          message: "Test alert",
          current: 1,
          previous: 5,
          deltaPoints: 4,
        },
      ],
    });
    expect(r.whatToImprove.some((x) => x === "Test alert")).toBe(true);
  });
});
