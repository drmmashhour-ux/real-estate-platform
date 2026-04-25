import { describe, expect, it } from "vitest";
import { classifyDealStage } from "../deal-stage-classifier";
import type { ConversationAnalysisResult } from "../conversation-analysis.engine";
import type { ObjectionClassifierResult } from "../objection-classifier";
import type { MemorySnapshotShape } from "@/modules/messaging/assistant/next-action.service";

const baseAnalysis = (): ConversationAnalysisResult => ({
  sentiment: "NEUTRAL",
  dealProbability: 50,
  engagementScore: 55,
  insights: ["exploratory"],
});

const emptyObjections = (): ObjectionClassifierResult => ({ objections: [], dominantObjection: null });
const mem = (): MemorySnapshotShape => ({ profile: { budget: null, preferredArea: null, type: null }, notes: "" });

describe("classifyDealStage", () => {
  it("classifies visit language as visit_ready", () => {
    const messages = [
      {
        body: "Can we schedule a visit this week?",
        createdAt: new Date().toISOString(),
        senderId: "c",
        counterpartyId: "c",
        viewerId: "b",
      },
    ];
    const r = classifyDealStage(messages, baseAnalysis(), mem(), emptyObjections());
    expect(r.stage).toBe("visit_ready");
  });

  it("is conservative on very short thread", () => {
    const messages = [
      {
        body: "Hi",
        createdAt: new Date().toISOString(),
        senderId: "c",
        counterpartyId: "c",
        viewerId: "b",
      },
    ];
    const r = classifyDealStage(messages, { ...baseAnalysis(), engagementScore: 30 }, mem(), emptyObjections());
    expect(r.stage).toBe("new");
  });
});
