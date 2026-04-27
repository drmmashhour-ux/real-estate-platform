import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

const mockOptimize = vi.fn();
vi.mock("@/lib/campaign-optimizer/optimize-campaign-hardening", () => ({
  optimizeCampaign: (...a: unknown[]) => mockOptimize(...a),
}));

vi.mock("@/lib/auth/session", () => ({
  getGuestId: vi.fn().mockResolvedValue("user-1"),
}));

describe("POST /api/bnhub/growth/optimize-campaign", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("pause dry-run does not set applied", async () => {
    mockOptimize.mockResolvedValue({
      campaignId: "c1",
      dryRun: true,
      recommendation: "pause_campaign",
      suggestedAction: "pause_campaign",
      reason: "Spend is material…",
      applied: false,
    });
    const res = await POST(
      new Request("http://x/api/bnhub/growth/optimize-campaign", {
        method: "POST",
        body: JSON.stringify({ campaignId: "c1", dryRun: true }),
        headers: { "Content-Type": "application/json" },
      })
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { dryRun: boolean; applied: boolean };
    expect(data.dryRun).toBe(true);
    expect(data.applied).toBe(false);
    expect(mockOptimize).toHaveBeenCalledWith("user-1", "c1", true);
  });

  it("apply pause uses dryRun false", async () => {
    mockOptimize.mockResolvedValue({
      campaignId: "c1",
      dryRun: false,
      recommendation: "pause_campaign",
      suggestedAction: "pause_campaign",
      reason: "Paused.",
      applied: true,
    });
    const res = await POST(
      new Request("http://x/api/bnhub/growth/optimize-campaign", {
        method: "POST",
        body: JSON.stringify({ campaignId: "c1", dryRun: false }),
        headers: { "Content-Type": "application/json" },
      })
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as { applied: boolean };
    expect(data.applied).toBe(true);
    expect(mockOptimize).toHaveBeenCalledWith("user-1", "c1", false);
  });
});
