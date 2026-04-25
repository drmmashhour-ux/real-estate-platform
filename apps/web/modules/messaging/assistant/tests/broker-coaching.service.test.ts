import { describe, expect, it } from "vitest";
import { generateBrokerCoaching } from "../broker-coaching.service";
import type { ConversationAnalysisResult } from "@/modules/messaging/analysis/conversation-analysis.engine";
import type { MemorySnapshotShape } from "../next-action.service";

const analysis = (): ConversationAnalysisResult => ({
  sentiment: "NEUTRAL",
  dealProbability: 45,
  engagementScore: 40,
  insights: ["hesitate"],
});

const mem = (): MemorySnapshotShape => ({ profile: { budget: "500k", preferredArea: "Plateau", type: "Condo" }, notes: "" });

describe("generateBrokerCoaching", () => {
  it("returns at least one coaching line without throwing on sparse data", () => {
    const r = generateBrokerCoaching({
      conversation: { id: "x" },
      insights: analysis(),
      objections: { objections: [], dominantObjection: null },
      dealStage: { stage: "stalled", confidence: 0.4, rationale: ["silence"] },
      riskHeatmap: {
        overallRisk: "high",
        riskScore: 70,
        risks: [
          { key: "low_engagement", label: "Low engagement", level: "high", rationale: ["engagement model low"] },
        ],
      },
      clientMemory: mem(),
    });
    expect(r.coaching.length).toBeGreaterThan(0);
  });
});
