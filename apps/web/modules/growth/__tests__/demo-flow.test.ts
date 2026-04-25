import { describe, expect, it } from "vitest";
import { getDemoFlow } from "../demo-flow";

describe("getDemoFlow", () => {
  it("stays at or under a three-minute budget and has six steps", () => {
    const flow = getDemoFlow();
    expect(flow.steps).toHaveLength(6);
    expect(flow.totalDurationSec).toBeLessThanOrEqual(180);
  });

  it("exposes a top deal, pipeline snapshot, and ordered ids", () => {
    const flow = getDemoFlow();
    expect(flow.deals.length).toBeGreaterThanOrEqual(3);
    expect(flow.deals[0]!.id).toBe("demo-1");
    expect(flow.pipeline.map((p) => p.stage).join(",")).toContain("New");
  });
});
