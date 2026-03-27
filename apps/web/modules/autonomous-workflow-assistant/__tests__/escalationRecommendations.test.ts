import { describe, expect, it } from "vitest";
import { generateEscalationRecommendations } from "@/src/modules/autonomous-workflow-assistant/application/generateEscalationRecommendations";

describe("generateEscalationRecommendations", () => {
  it("recommends escalation when blockers are multiple", () => {
    const items = generateEscalationRecommendations({
      blockingIssues: ["b1", "b2"],
      contradictions: [],
      criticalOpen: 0,
    });
    expect(items.length).toBeGreaterThan(0);
  });

  it("does not recommend escalation when case is stable", () => {
    const items = generateEscalationRecommendations({
      blockingIssues: [],
      contradictions: [],
      criticalOpen: 0,
    });
    expect(items.length).toBe(0);
  });
});

