import { describe, it, expect, vi, beforeEach } from "vitest";

import { GET } from "./route";

const brainMocks = vi.hoisted(() => ({
  getMarketplaceBrainSummary: vi.fn(),
  getMarketplaceBrainActions: vi.fn(),
}));

vi.mock("@/lib/flags", () => ({
  flags: { AUTONOMOUS_AGENT: false, AI_PRICING: false, RECOMMENDATIONS: false },
}));

vi.mock("@/lib/ai/marketplaceBrain", () => ({
  getMarketplaceBrainSummary: brainMocks.getMarketplaceBrainSummary,
  getMarketplaceBrainActions: brainMocks.getMarketplaceBrainActions,
}));

vi.mock("@/lib/security/rateLimit", () => ({
  getClientIp: () => "127.0.0.1",
  rateLimit: () => true,
}));

vi.mock("@/lib/monitoring/errorLogger", () => ({
  logError: vi.fn(),
}));

describe("GET /api/ai/marketplace-brain (disabled)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns safe disabled response and does not load brain", async () => {
    const res = await GET(new Request("http://localhost/api/ai/marketplace-brain"));
    expect(res.status).toBe(200);
    const data = (await res.json()) as {
      summary: null;
      actions: unknown[];
      message: string;
    };
    expect(data.summary).toBeNull();
    expect(data.actions).toEqual([]);
    expect(data.message).toContain("disabled");
    expect(brainMocks.getMarketplaceBrainSummary).not.toHaveBeenCalled();
    expect(brainMocks.getMarketplaceBrainActions).not.toHaveBeenCalled();
  });
});
