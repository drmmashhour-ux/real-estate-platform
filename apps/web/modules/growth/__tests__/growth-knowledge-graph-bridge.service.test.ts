import { describe, expect, it } from "vitest";
import { buildKnowledgeGraphInsights } from "../growth-knowledge-graph-bridge.service";
import type { GrowthKnowledgeGraph } from "../growth-knowledge-graph.types";

describe("buildKnowledgeGraphInsights", () => {
  it("returns bounded strings", () => {
    const g: GrowthKnowledgeGraph = {
      nodes: [],
      edges: [],
      summary: {
        nodeCount: 0,
        edgeCount: 0,
        dominantThemes: ["followup", "conversion"],
        recurringBlockers: ["Delay A", "Delay B"],
        repeatedWinners: ["Campaign X"],
      },
      createdAt: "x",
    };
    const lines = buildKnowledgeGraphInsights(g);
    expect(lines.length).toBeLessThanOrEqual(8);
    expect(lines.some((l) => l.includes("Recurring"))).toBe(true);
  });
});
