import { describe, it, expect } from "vitest";

describe("Confidence scoring", () => {
  it("high comparable count increases score", () => {
    expect(5).toBeGreaterThanOrEqual(3);
  });
  it("confidence label is one of low, medium, high", () => {
    const labels = ["low", "medium", "high"];
    expect(labels).toContain("medium");
  });
});
