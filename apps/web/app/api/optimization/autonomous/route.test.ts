import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const { mockRun, mockFlags } = vi.hoisted(() => ({
  mockRun: vi.fn(),
  mockFlags: { AUTONOMOUS_OPTIMIZATION_LOOP: true },
}));

vi.mock("@/lib/growth/autonomousOptimizationLoop", () => ({
  runAutonomousOptimizationLoop: (...a: unknown[]) => mockRun(...a),
}));

vi.mock("@/lib/flags", () => ({
  flags: mockFlags,
}));

vi.mock("@/lib/auth/require-user", () => ({
  requireUser: vi.fn().mockResolvedValue({ ok: true, user: { id: "u-1" } }),
}));

vi.mock("@/lib/security/rateLimit", () => ({
  getClientIp: () => "127.0.0.1",
  rateLimit: () => true,
}));

describe("POST /api/optimization/autonomous", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFlags.AUTONOMOUS_OPTIMIZATION_LOOP = true;
    mockRun.mockResolvedValue({ ok: true, runId: "r1", dryRun: true, actions: [], inputErrors: [] });
  });

  it("returns 403 when loop flag is off", async () => {
    mockFlags.AUTONOMOUS_OPTIMIZATION_LOOP = false;
    const res = await POST(
      new Request("http://x/api/optimization/autonomous", {
        method: "POST",
        body: JSON.stringify({ dryRun: true }),
        headers: { "Content-Type": "application/json" },
      })
    );
    expect(res.status).toBe(403);
    const j = (await res.json()) as { disabled?: boolean };
    expect(j.disabled).toBe(true);
    expect(mockRun).not.toHaveBeenCalled();
  });
});
