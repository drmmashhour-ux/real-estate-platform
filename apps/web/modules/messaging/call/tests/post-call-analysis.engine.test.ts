import { describe, expect, it } from "vitest";
import { runPostCallAnalysis, buildMessagesFromTranscript } from "../post-call-analysis.engine";
import type { MemorySnapshotShape } from "@/modules/messaging/assistant/next-action.service";
import type { CallSession } from "../call.types";

const mem = (): MemorySnapshotShape => ({
  profile: { budget: null, preferredArea: null, type: null },
  notes: "",
});

const baseCall = (): CallSession => ({
  id: "call-1",
  conversationId: "conv-1",
  brokerId: "b1",
  clientId: "c1",
  startedAt: new Date().toISOString(),
  endedAt: new Date().toISOString(),
  durationSec: 120,
  status: "ended",
  metadata: {},
});

describe("buildMessagesFromTranscript", () => {
  it("splits into alternating turns", () => {
    const m = buildMessagesFromTranscript("Line A for client\n\nLine B for broker", "b1", "c1");
    expect(m.length).toBe(2);
    expect(m[0]!.senderId).toBe("c1");
    expect(m[1]!.senderId).toBe("b1");
  });
});

describe("runPostCallAnalysis", () => {
  it("returns a neutral sparse fallback when no transcript", () => {
    const r = runPostCallAnalysis(baseCall(), undefined, mem());
    expect(r.summary).toBeTruthy();
    expect(r.keyPoints.length).toBeGreaterThan(0);
    expect(r.dealStage.stage).toBeTruthy();
  });

  it("uses transcript when provided", () => {
    const r = runPostCallAnalysis(
      baseCall(),
      "We are interested in a condo. The price is too high for us in Montreal.",
      mem()
    );
    expect(r.summary).toBeTruthy();
    expect(r.objections).toBeDefined();
  });
});
