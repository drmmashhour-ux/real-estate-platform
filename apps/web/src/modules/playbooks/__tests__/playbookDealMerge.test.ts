import { describe, expect, it } from "vitest";
import { mergePlaybookWithDealAssistant } from "../playbookDealMerge";

describe("mergePlaybookWithDealAssistant", () => {
  it("returns playbook only when AI confidence is low", () => {
    const pb = "Do you want me to move this forward for you?";
    expect(mergePlaybookWithDealAssistant(pb, { messageSuggestion: "Extra AI line.", confidence: 0.4 })).toBe(pb);
  });

  it("appends AI when confident and non-overlapping", () => {
    const pb = "I'll connect you directly so you can get full details quickly.";
    const ai =
      "Thanks for the detail — I can pull a few concrete next steps. What would be most useful right now?";
    const out = mergePlaybookWithDealAssistant(pb, { messageSuggestion: ai, confidence: 0.85 });
    expect(out.startsWith(pb)).toBe(true);
    expect(out.includes("concrete next steps")).toBe(true);
  });
});
