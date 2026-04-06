import { describe, expect, it, vi } from "vitest";
import { getGrowthEngineDashboardMetrics } from "../metrics";

describe("getGrowthEngineDashboardMetrics", () => {
  it("aggregates counts and conversion rate", async () => {
    const count = vi
      .fn()
      .mockResolvedValueOnce(3) // created today
      .mockResolvedValueOnce(4) // contacted
      .mockResolvedValueOnce(2) // interested
      .mockResolvedValueOnce(5) // converted
      .mockResolvedValueOnce(20); // total active

    const groupBy = vi
      .fn()
      .mockResolvedValueOnce([{ city: "Montreal", _count: { city: 9 } }])
      .mockResolvedValueOnce([{ source: "form", _count: { source: 12 } }])
      .mockResolvedValueOnce([
        { stage: "new", _count: { stage: 10 } },
        { stage: "converted", _count: { stage: 5 } },
      ]);

    const prisma = {
      growthEngineLead: { count, groupBy },
    };

    const m = await getGrowthEngineDashboardMetrics(prisma as never);
    expect(m.leadsCreatedToday).toBe(3);
    expect(m.leadsContacted).toBe(4);
    expect(m.leadsInterested).toBe(2);
    expect(m.conversionRate).toBe(25);
    expect(m.topCity).toBe("Montreal");
    expect(m.topSource).toBe("form");
    expect(m.byStage.new).toBe(10);
    expect(m.byStage.converted).toBe(5);
  });
});
