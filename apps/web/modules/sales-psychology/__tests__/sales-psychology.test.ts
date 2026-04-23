import { describe, expect, it } from "vitest";

import { detectClientPsychology, detectDecisionStage } from "../psychology-detection.service";
import { getPsychologyStrategy } from "../psychology-strategy.service";
import { analyzePostCallPsychology, buildPsychologySuggestion } from "../psychology-suggestion.service";

describe("psychology-detection", () => {
  it("detects skeptical tone", () => {
    const r = detectClientPsychology("Who else uses this — sounds like hype.");
    expect(r.primaryState).toBe("skeptical");
    expect(r.stage).toBeTruthy();
  });

  it("detects defensive / rejecting stage", () => {
    const r = detectClientPsychology("Stop calling — not interested.");
    expect(["defensive", "disengaged"]).toContain(r.primaryState);
    expect(detectDecisionStage("Stop calling")).toBe("rejecting");
  });

  it("detects readiness", () => {
    const r = detectClientPsychology("Send the calendar invite — tomorrow morning works.");
    expect(r.stage).toBe("ready_to_decide");
  });
});

describe("psychology-strategy", () => {
  it("maps skeptical to proof strategy", () => {
    const { key, strategy } = getPsychologyStrategy("skeptical", "exploring");
    expect(key).toBe("reduce_claims_proof_questions");
    expect(strategy.bullets.length).toBeGreaterThan(0);
  });
});

describe("psychology-suggestion", () => {
  it("returns a full bundle", () => {
    const b = buildPsychologySuggestion("Prove it with a live example.");
    expect(b.exampleSentence.length).toBeGreaterThan(20);
    expect(b.avoidPhrases.length).toBeGreaterThan(0);
    expect(b.indicator).toContain("🟡");
  });

  it("post-call analysis extracts themes", () => {
    const t = "Client: not sure\nClient: maybe later\nRep: we guarantee results always";
    const a = analyzePostCallPsychology(t);
    expect(a.mistakesObserved.some((m) => m.includes("Absolute"))).toBe(true);
  });
});
