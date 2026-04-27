import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const mockRun = vi.fn();

vi.mock("@/lib/marketing/autonomousCampaignLauncher", () => ({
  runAutonomousCampaignLauncher: (...a: unknown[]) => mockRun(...a),
}));

describe("POST /api/cron/campaign-auto-launch", () => {
  const prev = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "test-cron";
    vi.clearAllMocks();
    mockRun.mockResolvedValue({ dryRun: true, generated: 0, simulated: 0, selected: 0, scheduled: 0, campaigns: [] });
  });

  afterEach(() => {
    if (prev === undefined) {
      delete process.env.CRON_SECRET;
    } else {
      process.env.CRON_SECRET = prev;
    }
  });

  it("returns 401 without matching Bearer", async () => {
    const res = await POST(
      new Request("http://x/api/cron/campaign-auto-launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "00000000-0000-4000-8000-000000000001" }),
      })
    );
    expect(res.status).toBe(401);
    expect(mockRun).not.toHaveBeenCalled();
  });

  it("returns 401 when Bearer is wrong", async () => {
    const res = await POST(
      new Request("http://x/api/cron/campaign-auto-launch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer wrong",
        },
        body: JSON.stringify({ userId: "00000000-0000-4000-8000-000000000001" }),
      })
    );
    expect(res.status).toBe(401);
  });

  it("runs launcher when secret matches and body is valid", async () => {
    const res = await POST(
      new Request("http://x/api/cron/campaign-auto-launch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer test-cron",
        },
        body: JSON.stringify({ userId: "00000000-0000-4000-8000-000000000001", dryRun: true }),
      })
    );
    expect(res.status).toBe(200);
    expect(mockRun).toHaveBeenCalledWith({
      userId: "00000000-0000-4000-8000-000000000001",
      dryRun: true,
    });
  });
});
