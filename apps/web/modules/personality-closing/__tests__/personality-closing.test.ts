import { describe, expect, it } from "vitest";

import { detectClientPersonality } from "../personality-detection.service";
import { getPersonalityStrategy } from "../personality-strategy.service";
import { buildClosingCoachBundle } from "../personality-response.service";

describe("personality-detection", () => {
  it("detects driver cues", () => {
    const r = detectClientPersonality("Bottom line — what ROI do I get this quarter?");
    expect(r.primary).toBe("DRIVER");
    expect(r.confidence).toBeGreaterThan(50);
  });

  it("detects analytical cues", () => {
    const r = detectClientPersonality("Walk me through the methodology and the cohort you measured.");
    expect(r.primary).toBe("ANALYTICAL");
  });

  it("detects expressive cues", () => {
    const r = detectClientPersonality("This sounds amazing — what’s the big transformation story?");
    expect(r.primary).toBe("EXPRESSIVE");
  });

  it("detects amiable cues", () => {
    const r = detectClientPersonality("Thanks for calling — I appreciate you taking it slow with our team.");
    expect(r.primary).toBe("AMIABLE");
  });
});

describe("personality-strategy", () => {
  it("maps driver to fast close bullets", () => {
    const s = getPersonalityStrategy("DRIVER");
    expect(s.title).toContain("Driver");
    expect(s.bullets.some((b) => /short|fast|next/i.test(b))).toBe(true);
  });
});

describe("personality-response / closing bundle", () => {
  it("merges psychology + personality", () => {
    const b = buildClosingCoachBundle("Prove this isn’t hype — show me numbers.");
    expect(b).not.toBeNull();
    expect(b!.personalityIndicator).toMatch(/🔷|⚡|✨|🤝/);
    expect(b!.adaptedExampleSentence.length).toBeGreaterThan(15);
    expect(b!.avoidCombined.length).toBeGreaterThanOrEqual(b!.avoidPhrases.length);
    expect(b!.recommendedTone.length).toBeGreaterThan(10);
  });

  it("includes psychology indicator for skeptical tone", () => {
    const b = buildClosingCoachBundle("Who else uses this — sounds like hype.");
    expect(b!.indicator).toContain("🟡");
  });
});
