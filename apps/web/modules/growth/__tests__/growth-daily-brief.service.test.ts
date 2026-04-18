import { describe, expect, it, vi, beforeEach } from "vitest";
import { buildGrowthDailyBrief } from "../growth-daily-brief.service";
import { resetGrowthDailyBriefMonitoringForTests, getGrowthDailyBriefMonitoringSnapshot } from "../growth-daily-brief-monitoring.service";

vi.mock("../growth-executive.service", () => ({
  buildGrowthExecutiveSummary: vi.fn(),
}));

vi.mock("../growth-ai-analyzer.service", () => ({
  fetchEarlyConversionYesterdayStats: vi.fn(),
  fetchEarlyConversionAdsSnapshot: vi.fn(),
  computePaidFunnelAdsInsights: vi.fn(() => ({
    problems: [] as string[],
    opportunities: [] as string[],
    health: "OK" as const,
  })),
}));

beforeEach(() => {
  vi.clearAllMocks();
  resetGrowthDailyBriefMonitoringForTests();
});

describe("buildGrowthDailyBrief", () => {
  it("merges executive priorities, yesterday stats, and status without mutating inputs", async () => {
    const { buildGrowthExecutiveSummary } = await import("../growth-executive.service");
    const { fetchEarlyConversionYesterdayStats, fetchEarlyConversionAdsSnapshot } = await import("../growth-ai-analyzer.service");

    const exec = {
      status: "healthy" as const,
      topPriority: "Clear follow-up queue",
      topPriorities: [
        { id: "1", title: "P1", source: "leads" as const, impact: "high" as const, why: "x" },
        { id: "2", title: "P2", source: "ads" as const, impact: "medium" as const, why: "y" },
      ],
      topRisks: [],
      campaignSummary: {
        totalCampaigns: 3,
        topCampaign: "spring",
        adsPerformance: "OK" as const,
      },
      leadSummary: { totalLeads: 40, hotLeads: 2 },
      autopilot: { focusTitle: "Stabilize CRM routing", status: "healthy", topActionCount: 2 },
      createdAt: new Date().toISOString(),
    };

    vi.mocked(buildGrowthExecutiveSummary).mockResolvedValue(exec);
    vi.mocked(fetchEarlyConversionYesterdayStats).mockResolvedValue({
      utcDate: "2026-04-01",
      leads: 5,
      campaignsActive: 2,
      topCampaign: "spring",
    });
    vi.mocked(fetchEarlyConversionAdsSnapshot).mockResolvedValue({
      campaignCounts: [],
      totalLeads: 0,
      leadsWithUtmCampaign: 0,
      leadsToday: 2,
      topCampaign: null,
    });

    const brief = await buildGrowthDailyBrief();

    expect(brief.status).toBe("healthy");
    expect(brief.yesterday.leads).toBe(5);
    expect(brief.yesterday.campaignsActive).toBe(2);
    expect(brief.yesterday.topCampaign).toBe("spring");
    expect(brief.today.focus).toBe("Stabilize CRM routing");
    expect(brief.today.priorities.length).toBe(3);
    expect(brief.today.priorities[0]).toBe("P1");
    const snap = getGrowthDailyBriefMonitoringSnapshot();
    expect(snap.briefsGenerated).toBe(1);
    expect(snap.healthyCount).toBe(1);
  });

  it("adds blockers when no leads today and pads fallback priorities", async () => {
    const { buildGrowthExecutiveSummary } = await import("../growth-executive.service");
    const { fetchEarlyConversionYesterdayStats, fetchEarlyConversionAdsSnapshot } = await import("../growth-ai-analyzer.service");

    vi.mocked(buildGrowthExecutiveSummary).mockResolvedValue({
      status: "watch",
      topPriorities: [],
      topRisks: [],
      campaignSummary: { totalCampaigns: 1, adsPerformance: "WEAK" },
      leadSummary: { totalLeads: 1, hotLeads: 0 },
      createdAt: new Date().toISOString(),
    });
    vi.mocked(fetchEarlyConversionYesterdayStats).mockResolvedValue({
      utcDate: "2026-04-01",
      leads: 0,
      campaignsActive: 1,
    });
    vi.mocked(fetchEarlyConversionAdsSnapshot).mockResolvedValue({
      campaignCounts: [],
      totalLeads: 10,
      leadsWithUtmCampaign: 2,
      leadsToday: 0,
      topCampaign: { label: "c1", count: 2 },
    });

    const brief = await buildGrowthDailyBrief();
    expect(brief.today.priorities).toContain("Review new leads");
    expect(brief.today.priorities).toContain("Check campaign performance");
    expect(brief.blockers.some((b) => b.includes("No early-conversion leads"))).toBe(true);
    expect(brief.blockers.some((b) => b.includes("UTM campaigns were active"))).toBe(true);
  });

  it("degrades safely when executive build throws", async () => {
    const { buildGrowthExecutiveSummary } = await import("../growth-executive.service");
    vi.mocked(buildGrowthExecutiveSummary).mockRejectedValueOnce(new Error("db"));

    const brief = await buildGrowthDailyBrief();
    expect(brief.status).toBe("watch");
    expect(brief.blockers[0]).toMatch(/unavailable/i);
    expect(brief.today.priorities.length).toBe(3);
  });

  it("resetGrowthDailyBriefMonitoringForTests clears counters", async () => {
    const { buildGrowthExecutiveSummary } = await import("../growth-executive.service");
    const { fetchEarlyConversionYesterdayStats, fetchEarlyConversionAdsSnapshot } = await import("../growth-ai-analyzer.service");
    vi.mocked(buildGrowthExecutiveSummary).mockResolvedValue({
      status: "healthy",
      topPriorities: [{ id: "a", title: "T", source: "leads", impact: "low", why: "w" }],
      topRisks: [],
      campaignSummary: { totalCampaigns: 0, adsPerformance: "OK" },
      leadSummary: { totalLeads: 0, hotLeads: 0 },
      createdAt: new Date().toISOString(),
    });
    vi.mocked(fetchEarlyConversionYesterdayStats).mockResolvedValue({
      utcDate: "2026-04-01",
      leads: 1,
      campaignsActive: 0,
    });
    vi.mocked(fetchEarlyConversionAdsSnapshot).mockResolvedValue({
      campaignCounts: [],
      totalLeads: 1,
      leadsWithUtmCampaign: 0,
      leadsToday: 1,
      topCampaign: null,
    });
    await buildGrowthDailyBrief();
    expect(getGrowthDailyBriefMonitoringSnapshot().briefsGenerated).toBeGreaterThan(0);
    resetGrowthDailyBriefMonitoringForTests();
    expect(getGrowthDailyBriefMonitoringSnapshot().briefsGenerated).toBe(0);
  });
});
