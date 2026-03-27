import { describe, expect, it } from "vitest";
import { getCaseAIRecommendations } from "@/src/modules/case-command-center/application/getCaseAIRecommendations";

describe("case command recommendations", () => {
  it("prioritizes blockers", () => {
    const recs = getCaseAIRecommendations({ blockingIssues: ["x"], missingDependencies: [], crmLeadCount: 0 });
    expect(recs[0]?.priority).toBe("high");
  });
});
