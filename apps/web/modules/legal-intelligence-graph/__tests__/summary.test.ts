import { describe, expect, it, vi } from "vitest";
import { getLegalGraphSummary } from "@/src/modules/legal-intelligence-graph/application/getLegalGraphSummary";

vi.mock("@/src/modules/legal-intelligence-graph/infrastructure/legalGraphRepository", () => ({
  listGraphIssues: vi.fn().mockResolvedValue([
    { status: "open", severity: "critical", issueType: "review_blocker", message: "Blocked", title: "t" },
    { status: "open", severity: "warning", issueType: "missing_dependency", message: "Missing dep", title: "t" },
  ]),
}));

describe("getLegalGraphSummary", () => {
  it("builds deterministic health summary", async () => {
    const out = await getLegalGraphSummary("p1");
    expect(out.fileHealth).toBe("critical");
    expect(out.blockingIssues.length).toBeGreaterThan(0);
  });
});
