import { describe, expect, it, beforeEach } from "vitest";
import {
  getGrowthFusionMonitoringCounters,
  recordGrowthFusionRun,
  resetGrowthFusionMonitoringForTests,
} from "../growth-fusion-monitoring.service";
import type { GrowthFusionRawSnapshot } from "../growth-fusion-snapshot.service";
import type { GrowthFusionSummary, GrowthFusionAction } from "../growth-fusion.types";

beforeEach(() => {
  resetGrowthFusionMonitoringForTests();
});

describe("growth-fusion-monitoring", () => {
  it("increments counters on recordGrowthFusionRun", () => {
    const snapshot = {
      createdAt: "2026-04-02T12:00:00.000Z",
      leads: { totalCount: 1, recent7dCount: 0 },
      ads: { summary: null, byCampaign: null },
      cro: null,
      content: { adDrafts: 0, listingDrafts: 0, outreachDrafts: 0, skippedReason: "x" },
      autopilot: { actions: [] },
      influence: { suggestions: [] },
      warnings: ["leads_count_unavailable"],
    } as GrowthFusionRawSnapshot;

    const summary: GrowthFusionSummary = {
      status: "weak",
      topProblems: [],
      topOpportunities: [],
      topActions: [],
      confidence: 0.4,
      signals: [
        { source: "leads", id: "s1", type: "t", title: "T", description: "D", impact: "low", confidence: 0.3 },
      ],
      grouped: {
        leads: [
          { source: "leads", id: "s1", type: "t", title: "T", description: "D", impact: "low", confidence: 0.3 },
        ],
        ads: [],
        cro: [],
        content: [],
        autopilot: [],
      },
      createdAt: snapshot.createdAt,
    };

    const actions: GrowthFusionAction[] = [
      {
        id: "a1",
        title: "Test",
        description: "d",
        source: "leads",
        impact: "medium",
        confidence: 0.5,
        priorityScore: 50,
        why: "why",
        executionMode: "approval_required",
      },
    ];

    recordGrowthFusionRun({ snapshot, summary, actions });
    const c = getGrowthFusionMonitoringCounters();
    expect(c.fusionRuns).toBe(1);
    expect(c.weakStatusCount).toBe(1);
    expect(c.actionsGenerated).toBe(1);
    expect(c.sourceCoverage.leads).toBe(1);
  });
});
