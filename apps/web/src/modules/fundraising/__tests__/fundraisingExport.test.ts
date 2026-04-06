import { describe, expect, it } from "vitest";
import { fundraisingPayloadToCsv, fundraisingPayloadToJson } from "../fundraisingExport";
import type { FundraisingExportPayload } from "../fundraisingExport";
import type { PipelineSummary } from "../pipeline";

const mockPipeline: PipelineSummary = {
  totalInvestors: 2,
  byStage: { contacted: 1, interested: 1 },
  pipelineValueOpenCommitted: 500000,
  committedValue: 250000,
  closedValue: 0,
  recentInteractions: [],
};

const mockPayload: FundraisingExportPayload = {
  generatedAt: "2026-03-28T12:00:00.000Z",
  traction: {
    totalUsers: 1000,
    revenue30d: 12000,
    bookings30d: 40,
    growthTotalUsers: 1000,
    snapshotDate: "2026-03-28",
  },
  revenueEngine: {
    revenueToday: 50,
    eventsTodayByType: {},
    openOpportunities: 3,
    convertedLast30d: 2,
    lostLast30d: 1,
    opportunityConversionRate: 0.5,
  },
  fundraising: mockPipeline,
};

describe("fundraisingExport", () => {
  it("fundraisingPayloadToJson includes users revenue bookings", () => {
    const j = fundraisingPayloadToJson(mockPayload);
    const p = JSON.parse(j) as FundraisingExportPayload;
    expect(p.traction.totalUsers).toBe(1000);
    expect(p.traction.revenue30d).toBe(12000);
    expect(p.traction.bookings30d).toBe(40);
    expect(p.fundraising.totalInvestors).toBe(2);
  });

  it("fundraisingPayloadToCsv includes traction and fundraising rows", () => {
    const csv = fundraisingPayloadToCsv(mockPayload);
    expect(csv).toContain("traction,total_users,1000");
    expect(csv).toContain("traction,revenue_30d,12000");
    expect(csv).toContain("traction,bookings_30d,40");
    expect(csv).toContain("fundraising,pipeline_value_open_committed,500000");
    expect(csv).toContain("fundraising_stage,contacted,1");
  });
});
