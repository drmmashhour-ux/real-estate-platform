import { describe, expect, it } from "vitest";
import { getNextQuestion, type GrillContext, GRILL_QUESTION_BANK } from "../grillEngine";
import { evaluateGrillAnswer } from "../grillFeedback";

describe("grillEngine", () => {
  it("getNextQuestion returns a question for turn 0", () => {
    const ctx: GrillContext = {
      mode: "standard",
      personaId: "vc",
      pitchPhase: "opening",
      turnIndex: 0,
      weakAreas: [],
      pressureLevel: 0,
    };
    const n = getNextQuestion(ctx, { maxTurns: 8, bank: GRILL_QUESTION_BANK });
    expect(n).not.toBeNull();
    expect(n?.question.text.length).toBeGreaterThan(10);
    expect(n?.timeLimitSeconds).toBeGreaterThan(5);
  });

  it("getNextQuestion returns null at or past max turns", () => {
    const ctx: GrillContext = {
      mode: "standard",
      personaId: "angel",
      pitchPhase: "close",
      turnIndex: 8,
      weakAreas: [],
      pressureLevel: 0,
    };
    expect(getNextQuestion(ctx, { maxTurns: 8 })).toBeNull();
  });
});

describe("grillFeedback", () => {
  it("evaluates a minimal answer", () => {
    const q = GRILL_QUESTION_BANK.find((x) => x.id === "why_not_chatgpt")!;
    const fb = evaluateGrillAnswer(
      "We validate domain rules. ChatGPT does not.",
      q.keyPoints,
      q.modelAnswer,
    );
    expect(fb.score).toBeGreaterThan(0);
    expect(fb.confidenceLevel).toBeDefined();
  });
});
