import { describe, expect, it } from "vitest";
import { minimalV4Payload } from "../test-fixtures/v4-minimal";
import { mapMorningBriefMode } from "./morning-brief-mode-mapper";

describe("mapMorningBriefMode", () => {
  it("returns morning_brief shape", () => {
    const v = mapMorningBriefMode(minimalV4Payload());
    expect(v.mode).toBe("morning_brief");
    expect(v.heroSummary.length).toBeGreaterThan(0);
  });
});
