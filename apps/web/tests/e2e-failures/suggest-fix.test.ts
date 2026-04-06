import { describe, expect, it } from "vitest";
import { isRerunRecommendedForFailureType } from "../../e2e/failures/rerun-scenario";
import { suggestFixForType } from "../../e2e/failures/suggest-fix";

describe("suggestFixForType", () => {
  it("returns translation paths for missing_translation", () => {
    const p = suggestFixForType("missing_translation", "t('foo.bar')");
    expect(p.filesLikelyInvolved.some((f) => f.includes("messages"))).toBe(true);
    expect(p.suggestedFixZones.length).toBeGreaterThan(0);
  });
});

describe("isRerunRecommendedForFailureType", () => {
  it("discourages rerun for infra and db issues", () => {
    expect(isRerunRecommendedForFailureType("infra_blocked")).toBe(false);
    expect(isRerunRecommendedForFailureType("db_consistency")).toBe(false);
  });

  it("allows rerun for api_error", () => {
    expect(isRerunRecommendedForFailureType("api_error")).toBe(true);
  });
});
