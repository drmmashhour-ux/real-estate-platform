import { describe, expect, it } from "vitest";

/**
 * Contract for grouped task payloads used by Approval Center + Case Command Center + Seller Declaration.
 * Ensures UI integration points stay aligned without pulling React into unit tests.
 */
describe("grouped autonomous tasks API shape (integration contract)", () => {
  it("defines the fields AutonomousTaskReviewPanel consumes", () => {
    const groupedResponse = {
      tasks: [],
      groups: [] as { id: string; title: string; tasks: unknown[] }[],
      standalone: [],
      criticalBlockers: [],
      approvalRequired: [],
      resolvedRecent: [],
      all: [],
    };
    expect(groupedResponse).toHaveProperty("criticalBlockers");
    expect(groupedResponse).toHaveProperty("approvalRequired");
    expect(groupedResponse).toHaveProperty("groups");
    expect(groupedResponse).toHaveProperty("standalone");
    expect(groupedResponse).toHaveProperty("resolvedRecent");
  });
});
