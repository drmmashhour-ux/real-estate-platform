import { describe, expect, it } from "vitest";
import {
  bumpJourneyMetric,
  getHubJourneyMonitoringSnapshot,
  resetHubJourneyMonitoringForTests,
} from "../hub-journey-monitoring.service";
import { buildHubJourneyPlan } from "../hub-journey-state.service";

describe("hub journey monitoring", () => {
  it("increments plansBuilt when building a plan", () => {
    resetHubJourneyMonitoringForTests();
    buildHubJourneyPlan("seller", { locale: "en", country: "ca" });
    const snap = getHubJourneyMonitoringSnapshot();
    expect(snap.plansBuilt).toBeGreaterThanOrEqual(1);
    expect(snap.hubsVisited).toBeGreaterThanOrEqual(1);
  });

  it("bumpJourneyMetric never throws", () => {
    expect(() => bumpJourneyMetric("suggestionsGenerated", 2)).not.toThrow();
  });
});
