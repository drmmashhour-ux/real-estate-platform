import { describe, expect, it } from "vitest";
import { buildConversationRiskHeatmap } from "../risk-heatmap.service";
import type { ConversationAnalysisResult } from "../conversation-analysis.engine";
import type { DealStageResult } from "../deal-stage-classifier";
import type { ObjectionClassifierResult } from "../objection-classifier";
import type { AssistantConversationShape } from "@/modules/messaging/assistant/next-action.service";

const conv = (): AssistantConversationShape => ({ id: "c1" });
const analysis = (o: Partial<ConversationAnalysisResult>): ConversationAnalysisResult => ({
  sentiment: "NEUTRAL",
  dealProbability: 40,
  engagementScore: 50,
  insights: o.insights ?? ["test"],
  ...o,
});
const stage = (s: DealStageResult["stage"]): DealStageResult => ({
  stage: s,
  confidence: 0.5,
  rationale: [],
});

describe("buildConversationRiskHeatmap", () => {
  it("returns low risk placeholder when no strong flags", () => {
    const objections: ObjectionClassifierResult = { objections: [], dominantObjection: null };
    const r = buildConversationRiskHeatmap(
      conv(),
      analysis({ engagementScore: 60 }),
      objections,
      stage("qualified"),
      { avgResponseMinutes: 10, lastGapHours: 2 }
    );
    expect(r.riskScore).toBeLessThan(100);
    expect(r.risks.length).toBeGreaterThan(0);
  });

  it("escalates for slow broker response when gap hints are bad", () => {
    const objections: ObjectionClassifierResult = { objections: [], dominantObjection: null };
    const r = buildConversationRiskHeatmap(
      conv(),
      analysis({ engagementScore: 30 }),
      objections,
      stage("stalled"),
      { avgResponseMinutes: 200, lastGapHours: 2 }
    );
    expect(r.risks.some((x) => x.key === "slow_broker")).toBe(true);
  });
});
