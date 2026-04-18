import { describe, expect, it, beforeEach } from "vitest";
import {
  getGrowthKnowledgeGraphMonitoringSnapshot,
  recordGrowthKnowledgeGraphBuild,
  resetGrowthKnowledgeGraphMonitoringForTests,
} from "../growth-knowledge-graph-monitoring.service";

beforeEach(() => {
  resetGrowthKnowledgeGraphMonitoringForTests();
});

describe("growth-knowledge-graph-monitoring", () => {
  it("updates counters", () => {
    recordGrowthKnowledgeGraphBuild({
      nodeCount: 10,
      edgeCount: 5,
      blockerClusterSize: 3,
      winnerClusterSize: 2,
      conflictPairs: 1,
      topThemes: ["a", "b"],
      missingDataWarningCount: 1,
    });
    const s = getGrowthKnowledgeGraphMonitoringSnapshot();
    expect(s.graphBuilds).toBe(1);
    expect(s.nodesBuilt).toBe(10);
    expect(s.edgesBuilt).toBe(5);
    expect(s.missingDataWarnings).toBe(1);
  });
});
