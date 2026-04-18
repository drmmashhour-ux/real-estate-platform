import { describe, expect, it } from "vitest";
import { buildBriefingCards } from "./company-command-center-briefing.service";
import { minimalV3Payload } from "../test-fixtures/v3-minimal";

describe("buildBriefingCards", () => {
  it("adds baseline card when previous snapshot missing", () => {
    const cur = minimalV3Payload();
    const r = buildBriefingCards(cur, null);
    expect(r.cards.some((c) => c.title === "Baseline")).toBe(true);
  });
});
