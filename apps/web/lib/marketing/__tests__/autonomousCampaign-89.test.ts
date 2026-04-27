import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetBroker, mockGetFeedback, mockGetPatterns, mockCreateCampaign, mockScheduleCampaign, mockRunCampaignSimulation, mockWrite } = vi.hoisted(() => ({
  mockGetBroker: vi.fn(),
  mockGetFeedback: vi.fn(),
  mockGetPatterns: vi.fn(),
  mockCreateCampaign: vi.fn(),
  mockScheduleCampaign: vi.fn(),
  mockRunCampaignSimulation: vi.fn(),
  mockWrite: vi.fn(async () => undefined),
}));

vi.mock("@/lib/broker/intelligence", () => ({
  getBrokerIntelligence: (...a: unknown[]) => mockGetBroker(...a),
}));

vi.mock("@/lib/marketing/campaignFeedback", () => ({
  getCampaignFeedbackInsights: (...a: unknown[]) => mockGetFeedback(...a),
}));

vi.mock("@/lib/marketing/campaignLearning", () => ({
  getWinningCampaignPatterns: (...a: unknown[]) => mockGetPatterns(...a),
}));

vi.mock("@/lib/analytics/tracker", () => ({
  writeMarketplaceEvent: mockWrite,
  trackEvent: mockWrite,
}));

/** Avoid loading real `campaignEngine` (Prisma at import). Re-export pure helpers only. */
vi.mock("@/lib/marketing/campaignEngine", async () => {
  const p = await import("@/lib/marketing/campaignEnginePure");
  return {
    ...p,
    createCampaign: (...a: unknown[]) => mockCreateCampaign(...a),
    scheduleCampaign: (...a: unknown[]) => mockScheduleCampaign(...a),
    runCampaignSimulation: (...a: unknown[]) => mockRunCampaignSimulation(...a),
  };
});

import { runAutonomousCampaignLauncher, scoreCampaign } from "@/lib/marketing/autonomousCampaignLauncher";

const uid = "00000000-0000-4000-8000-000000000001";

function oneBrokerInsight(overrides: Partial<{ audience: "buyer" | "host" }> = {}) {
  return [
    {
      listingId: "00000000-0000-4000-8000-0000000000aa",
      title: "Test listing",
      price: 100,
      city: "Montreal",
      views: 10,
      bookings: 1,
      status: "marketplace_live" as const,
      crmMarketplaceLive: true,
      conversionRate: 0.1,
      recommendation: "ok",
      audience: overrides.audience ?? "buyer",
      type: "listing_active" as const,
    },
  ];
}

describe("Order 89 — scoreCampaign", () => {
  it("clamps to 0–10", () => {
    expect(scoreCampaign({ ctr: 0, conversionRate: 0, costPerConversion: 1e9 })).toBe(0);
    const hi = scoreCampaign({ ctr: 0.1, conversionRate: 0.2, costPerConversion: 0 });
    expect(hi).toBeLessThanOrEqual(10);
    expect(hi).toBeGreaterThanOrEqual(0);
  });

  it("higher ctr/cvr increases score (cost held)", () => {
    const low = scoreCampaign({ ctr: 0.01, conversionRate: 0.01, costPerConversion: 10 });
    const high = scoreCampaign({ ctr: 0.05, conversionRate: 0.1, costPerConversion: 10 });
    expect(high).toBeGreaterThan(low);
  });
});

describe("Order 89 — runAutonomousCampaignLauncher", () => {
  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0.25);
    mockGetBroker.mockReset();
    mockGetFeedback.mockReset();
    mockGetPatterns.mockReset();
    mockCreateCampaign.mockReset();
    mockScheduleCampaign.mockReset();
    mockRunCampaignSimulation.mockReset();
    mockGetFeedback.mockResolvedValue({ eligible: false, campaignsAnalyzed: 0 });
    mockGetPatterns.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("no insights → no campaigns", async () => {
    mockGetBroker.mockResolvedValue([]);
    const r = await runAutonomousCampaignLauncher({ userId: uid, dryRun: true });
    expect(r.generated).toBe(0);
    expect(r.simulated).toBe(0);
    expect(r.selected).toBe(0);
    expect(r.scheduled).toBe(0);
    expect(r.campaigns).toEqual([]);
  });

  it("dry run: candidates from intelligence, no createCampaign", async () => {
    mockGetBroker.mockResolvedValue(oneBrokerInsight());
    const r = await runAutonomousCampaignLauncher({ userId: uid, dryRun: true });
    expect(r.generated).toBeGreaterThan(0);
    expect(r.simulated).toBe(r.generated);
    expect(mockCreateCampaign).not.toHaveBeenCalled();
    expect(mockRunCampaignSimulation).not.toHaveBeenCalled();
  });

  it("dry run: simulated = generated (one in-memory sim per candidate)", async () => {
    mockGetBroker.mockResolvedValue(oneBrokerInsight());
    const r = await runAutonomousCampaignLauncher({ userId: uid, dryRun: true });
    expect(r.simulated).toBe(r.generated);
  });

  it("not dry: createCampaign + runCampaignSimulation for each generated row", async () => {
    mockGetBroker.mockResolvedValue(oneBrokerInsight());
    mockCreateCampaign.mockImplementation(async (input: { headline: string }) => ({
      id: `c-${input.headline.slice(0, 8)}`,
    }));
    mockRunCampaignSimulation.mockResolvedValue({
      performance: {
        impressions: 2000,
        clicks: 80,
        conversions: 4,
        spend: 100,
      },
    });
    const r = await runAutonomousCampaignLauncher({ userId: uid, dryRun: false });
    expect(r.generated).toBeGreaterThan(0);
    expect(mockCreateCampaign).toHaveBeenCalledTimes(r.generated);
    expect(mockRunCampaignSimulation).toHaveBeenCalledTimes(r.generated);
  });
});
