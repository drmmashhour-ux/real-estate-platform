import { describe, expect, it, vi, beforeEach } from "vitest";
import { evaluateGrowthGovernance } from "../growth-governance.service";

const gov = vi.hoisted(() => ({
  governanceV1: true,
  fusionV1: false,
}));

vi.mock("@/config/feature-flags", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/config/feature-flags")>();
  return {
    ...mod,
    growthGovernanceFlags: new Proxy(mod.growthGovernanceFlags, {
      get(target, prop, receiver) {
        if (prop === "growthGovernanceV1") return gov.governanceV1;
        if (prop === "growthGovernanceEscalationV1") return true;
        if (prop === "growthGovernanceMonitoringV1") return false;
        return Reflect.get(target, prop, receiver);
      },
    }),
    growthFusionFlags: new Proxy(mod.growthFusionFlags, {
      get(target, prop, receiver) {
        if (prop === "growthFusionV1") return gov.fusionV1;
        return Reflect.get(target, prop, receiver);
      },
    }),
  };
});

vi.mock("@/lib/db", () => ({
  prisma: {
    lead: {
      findMany: vi.fn().mockResolvedValue([]),
    },
  },
}));

vi.mock("../growth-ai-analyzer.service", () => ({
  fetchEarlyConversionAdsSnapshot: vi.fn(),
  computePaidFunnelAdsInsights: vi.fn(),
}));

vi.mock("../ai-autopilot.service", () => ({
  buildAutopilotActions: vi.fn(() => []),
}));

vi.mock("../ai-autopilot-approval.service", () => ({
  getAutopilotActionStatus: vi.fn(() => "pending"),
}));

vi.mock("../growth-governance-monitoring.service", () => ({
  logGrowthGovernanceEvaluationStarted: vi.fn(),
  recordGrowthGovernanceEvaluation: vi.fn(),
}));

vi.mock("../ai-autopilot-followup.service", () => ({
  buildFollowUpQueue: vi.fn(() => []),
  leadRowToFollowUpInput: vi.fn((x: unknown) => x),
}));

import { fetchEarlyConversionAdsSnapshot, computePaidFunnelAdsInsights } from "../growth-ai-analyzer.service";
import { buildAutopilotActions } from "../ai-autopilot.service";
import { getAutopilotActionStatus } from "../ai-autopilot-approval.service";
import { buildFollowUpQueue } from "../ai-autopilot-followup.service";

const goodEarly = {
  campaignCounts: [
    { label: "utm-a", count: 12 },
    { label: "(no UTM)", count: 3 },
  ],
  totalLeads: 30,
  leadsWithUtmCampaign: 20,
  leadsToday: 6,
  topCampaign: { label: "utm-a", count: 12 },
};

beforeEach(() => {
  gov.governanceV1 = true;
  gov.fusionV1 = false;
  vi.mocked(fetchEarlyConversionAdsSnapshot).mockResolvedValue(goodEarly as never);
  vi.mocked(computePaidFunnelAdsInsights).mockReturnValue({
    problems: [],
    opportunities: [],
    health: "STRONG",
  });
  vi.mocked(buildAutopilotActions).mockReturnValue([]);
  vi.mocked(getAutopilotActionStatus).mockReturnValue("pending");
  vi.mocked(buildFollowUpQueue).mockReturnValue([]);
});

describe("evaluateGrowthGovernance", () => {
  it("returns null when governance v1 is off", async () => {
    gov.governanceV1 = false;
    await expect(evaluateGrowthGovernance()).resolves.toBeNull();
    gov.governanceV1 = true;
  });

  it("returns healthy with strong benign signals", async () => {
    const d = await evaluateGrowthGovernance();
    expect(d).not.toBeNull();
    expect(d?.status).toBe("healthy");
    expect(d?.topRisks.length).toBeGreaterThanOrEqual(0);
  });

  it("returns watch when campaigns exist but no leads today", async () => {
    vi.mocked(fetchEarlyConversionAdsSnapshot).mockResolvedValue({
      ...goodEarly,
      leadsToday: 0,
      totalLeads: 8,
      leadsWithUtmCampaign: 5,
    } as never);
    vi.mocked(computePaidFunnelAdsInsights).mockReturnValue({
      problems: [],
      opportunities: [],
      health: "WEAK",
    });
    const d = await evaluateGrowthGovernance();
    expect(d?.status).toBe("watch");
  });

  it("returns human_review_required when many autopilot rejections", async () => {
    vi.mocked(buildAutopilotActions).mockReturnValue([{ id: "a1" }, { id: "a2" }, { id: "a3" }] as never);
    vi.mocked(getAutopilotActionStatus).mockReturnValue("rejected");
    const d = await evaluateGrowthGovernance();
    expect(d?.status).toBe("human_review_required");
    expect(d?.topRisks.some((r) => r.category === "autopilot")).toBe(true);
    expect(d?.blockedDomains).toContain("autopilot");
  });

  it("returns human_review_required when due_now backlog piles up", async () => {
    vi.mocked(buildFollowUpQueue).mockReturnValue(
      Array.from({ length: 6 }, (_, i) => ({
        leadId: `l${i}`,
        status: "due_now" as const,
        queueScore: 80,
        name: null as string | null,
        email: null as string | null,
        aiPriority: null as string | null,
        rationale: "due",
        updatedAt: new Date().toISOString(),
        followUpPriority: "high" as const,
      })) as never,
    );
    const d = await evaluateGrowthGovernance();
    expect(d?.status).toBe("human_review_required");
    expect(d?.topRisks.some((r) => r.category === "leads")).toBe(true);
    expect(d?.blockedDomains).toContain("autopilot");
  });

  it("returns caution when campaign concentration risk surfaces", async () => {
    vi.mocked(fetchEarlyConversionAdsSnapshot).mockResolvedValue({
      ...goodEarly,
      topCampaign: { label: "weak", count: 4 },
      leadsWithUtmCampaign: 8,
      totalLeads: 20,
    } as never);
    vi.mocked(computePaidFunnelAdsInsights).mockReturnValue({
      problems: ["p1", "p2"],
      opportunities: [],
      health: "WEAK",
    });
    const d = await evaluateGrowthGovernance();
    expect(d?.status).toBe("caution");
    expect(d?.topRisks.length).toBeGreaterThan(0);
  });

  it("returns freeze_recommended when paid funnel shows sustained weakness", async () => {
    vi.mocked(fetchEarlyConversionAdsSnapshot).mockResolvedValue({
      ...goodEarly,
      totalLeads: 12,
      leadsToday: 2,
      leadsWithUtmCampaign: 10,
    } as never);
    vi.mocked(computePaidFunnelAdsInsights).mockReturnValue({
      problems: ["p1", "p2", "p3"],
      opportunities: [],
      health: "WEAK",
    });
    const d = await evaluateGrowthGovernance();
    expect(d?.status).toBe("freeze_recommended");
    expect(d?.blockedDomains).toEqual(expect.arrayContaining(["ads", "cro", "content", "fusion"]));
  });
});
