import { describe, expect, it } from "vitest";
import {
  getBrokerRoutingMonitoringSnapshot,
  recordRoutingSummaryBuilt,
  resetBrokerRoutingMonitoringForTests,
} from "@/modules/broker/routing/broker-routing-monitoring.service";

describe("broker routing monitoring", () => {
  it("updates counters without throwing", () => {
    resetBrokerRoutingMonitoringForTests();
    recordRoutingSummaryBuilt({
      candidateCount: 10,
      strongCandidates: 2,
      weakTopScore: true,
      missingRegion: true,
    });
    const s = getBrokerRoutingMonitoringSnapshot();
    expect(s.routingSummariesBuilt).toBe(1);
    expect(s.candidatesEvaluated).toBe(10);
    expect(s.strongCandidateCount).toBe(2);
    expect(s.weakRoutingCount).toBe(1);
    expect(s.missingDataWarnings).toBe(1);
  });
});
