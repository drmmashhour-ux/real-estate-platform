import { describe, expect, it } from "vitest";
import { computeClosingReadiness } from "../closing-readiness.service";
import type { ConversationAnalysisResult } from "../conversation-analysis.engine";
import type { DealStageResult } from "../deal-stage-classifier";
import type { ObjectionClassifierResult } from "../objection-classifier";
import type { AssistantConversationShape } from "@/modules/messaging/assistant/next-action.service";

const conv = (): AssistantConversationShape => ({ id: "c1" });

describe("computeClosingReadiness", () => {
  it("scores 0-100 and assigns label", () => {
    const st: DealStageResult = { stage: "visit_ready", confidence: 0.5, rationale: [] };
    const ins: ConversationAnalysisResult = { sentiment: "POSITIVE", dealProbability: 60, engagementScore: 70, insights: [] };
    const obj: ObjectionClassifierResult = { objections: [], dominantObjection: null };
    const r = computeClosingReadiness(conv(), st, obj, ins);
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
    expect(["not_ready", "progressing", "near_closing"]).toContain(r.label);
  });
});
