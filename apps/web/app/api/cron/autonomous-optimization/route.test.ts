import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const mockRun = vi.fn();
vi.mock("@/lib/growth/autonomousOptimizationLoop", () => ({
  runAutonomousOptimizationLoop: (...a: unknown[]) => mockRun(...a),
}));

describe("POST /api/cron/autonomous-optimization", () => {
  const prev = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "s3cret";
    vi.clearAllMocks();
    mockRun.mockResolvedValue({ ok: true, runId: "r1", dryRun: true, actions: [], inputErrors: [] });
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = prev;
  });

  it("rejects without CRON_SECRET match", async () => {
    const res = await POST(
      new Request("http://x/cron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      })
    );
    expect(res.status).toBe(401);
    expect(mockRun).not.toHaveBeenCalled();
  });

  it("runs with valid bearer", async () => {
    const res = await POST(
      new Request("http://x/cron", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer s3cret" },
        body: JSON.stringify({ dryRun: true }),
      })
    );
    expect(res.status).toBe(200);
    expect(mockRun).toHaveBeenCalled();
  });
});
