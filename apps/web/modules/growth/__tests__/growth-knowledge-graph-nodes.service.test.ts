import { describe, expect, it } from "vitest";
import { buildGrowthKnowledgeNodes } from "../growth-knowledge-graph-nodes.service";
import type { GrowthKnowledgeGraphBuildInput } from "../growth-knowledge-graph.types";

const minimalInput = (): GrowthKnowledgeGraphBuildInput => ({
  memory: null,
  executive: null,
  governance: null,
  strategyBundle: null,
  simulationBundle: null,
  autopilotActionTitles: [],
  adsBand: "OK",
  missingDataWarnings: [],
});

describe("buildGrowthKnowledgeNodes", () => {
  it("returns empty-ish graph for empty inputs", () => {
    const nodes = buildGrowthKnowledgeNodes(minimalInput());
    expect(Array.isArray(nodes)).toBe(true);
  });

  it("creates nodes from memory entries without mutating input", () => {
    const input = minimalInput();
    input.memory = {
      recurringBlockers: [
        {
          id: "m1",
          category: "blocker",
          title: "Follow-up delays",
          detail: "d",
          source: "executive",
          confidence: 0.5,
          createdAt: "x",
        },
      ],
      winningPatterns: [],
      campaignLessons: [],
      followupLessons: [],
      governanceLessons: [],
      operatorPreferences: [],
      notes: [],
      createdAt: "x",
    };
    const snap = JSON.stringify(input);
    const nodes = buildGrowthKnowledgeNodes(input);
    expect(JSON.stringify(input)).toBe(snap);
    expect(nodes.some((n) => n.type === "blocker" && n.title.includes("Follow-up"))).toBe(true);
  });
});
