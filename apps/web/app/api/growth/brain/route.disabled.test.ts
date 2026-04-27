import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

const { brainMocks, trackEventMock } = vi.hoisted(() => ({
  brainMocks: {
    getGrowthBrainSummary: vi.fn(),
    getGrowthBrainActions: vi.fn(),
  },
  trackEventMock: vi.fn(),
}));

vi.mock("@/lib/flags", () => ({
  flags: { AUTONOMOUS_AGENT: false, AI_PRICING: false, RECOMMENDATIONS: false },
}));

vi.mock("@/lib/growth/growthBrain", () => ({
  getGrowthBrainSummary: brainMocks.getGrowthBrainSummary,
  getGrowthBrainActions: brainMocks.getGrowthBrainActions,
}));

vi.mock("@/lib/security/rateLimit", () => ({
  getClientIp: () => "127.0.0.1",
  rateLimit: () => true,
}));

vi.mock("@/lib/monitoring/errorLogger", () => ({
  logError: vi.fn(),
}));

vi.mock("@/src/services/analytics", () => ({
  trackEvent: trackEventMock,
}));

describe("GET /api/growth/brain (disabled)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns safe disabled payload and does not load growth brain or track", async () => {
    const res = await GET(new Request("http://localhost/api/growth/brain"));
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      summary: null;
      actions: unknown[];
      message: string;
    };
    expect(data.summary).toBeNull();
    expect(data.actions).toEqual([]);
    expect(data.message).toContain("disabled");
    expect(brainMocks.getGrowthBrainSummary).not.toHaveBeenCalled();
    expect(brainMocks.getGrowthBrainActions).not.toHaveBeenCalled();
    expect(trackEventMock).not.toHaveBeenCalled();
  });
});
