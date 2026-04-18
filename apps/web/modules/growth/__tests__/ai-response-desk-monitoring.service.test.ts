import { describe, expect, it, beforeEach } from "vitest";
import {
  getAiResponseDeskMonitoringSnapshot,
  recordResponseDeskCopy,
  recordResponseDeskDraftsQueued,
  recordResponseDeskPanelView,
  resetAiResponseDeskMonitoringForTests,
} from "../ai-response-desk-monitoring.service";

beforeEach(() => {
  resetAiResponseDeskMonitoringForTests();
});

describe("ai-response-desk-monitoring", () => {
  it("increments counters", () => {
    recordResponseDeskPanelView();
    recordResponseDeskDraftsQueued(3);
    recordResponseDeskCopy("lead-1");
    const s = getAiResponseDeskMonitoringSnapshot();
    expect(s.panelViews).toBe(1);
    expect(s.draftsQueued).toBe(3);
    expect(s.copies).toBe(1);
  });

  it("reset clears", () => {
    recordResponseDeskPanelView();
    resetAiResponseDeskMonitoringForTests();
    expect(getAiResponseDeskMonitoringSnapshot().panelViews).toBe(0);
  });
});
