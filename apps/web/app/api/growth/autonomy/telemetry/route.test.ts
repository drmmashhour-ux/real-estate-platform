import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/modules/growth-machine/growth-api-context", () => ({
  requireGrowthMachineActor: vi.fn(() =>
    Promise.resolve({ ok: true as const, userId: "u1", role: "ADMIN" }),
  ),
}));

const recordPrefill = vi.fn();
const recordChecklist = vi.fn();

vi.mock("@/modules/growth/growth-autonomy-monitoring.service", () => ({
  recordGrowthAutonomyPrefillTelemetryEvent: (...args: unknown[]) => recordPrefill(...args),
  recordGrowthAutonomyChecklistCompletionEvent: (...args: unknown[]) => recordChecklist(...args),
}));

describe("POST /api/growth/autonomy/telemetry", () => {
  beforeEach(() => {
    recordPrefill.mockClear();
    recordChecklist.mockClear();
  });

  it("records prefill events", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/growth/autonomy/telemetry", {
        method: "POST",
        body: JSON.stringify({ event: "prefill_navigate" }),
      }),
    );
    expect(res.status).toBe(200);
    expect(recordPrefill).toHaveBeenCalled();
  });

  it("records checklist completion", async () => {
    const { POST } = await import("./route");
    await POST(
      new Request("http://localhost/api/growth/autonomy/telemetry", {
        method: "POST",
        body: JSON.stringify({ event: "validation_checklist_complete" }),
      }),
    );
    expect(recordChecklist).toHaveBeenCalled();
  });

  it("ignores unknown events without throwing", async () => {
    const { POST } = await import("./route");
    const res = await POST(
      new Request("http://localhost/api/growth/autonomy/telemetry", {
        method: "POST",
        body: JSON.stringify({ event: "unknown" }),
      }),
    );
    expect(res.status).toBe(200);
    expect(recordPrefill).not.toHaveBeenCalled();
    expect(recordChecklist).not.toHaveBeenCalled();
  });
});
