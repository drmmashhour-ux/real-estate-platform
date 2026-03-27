import { describe, it, expect } from "vitest";
import { splitMortgageCommission } from "./commission";

describe("splitMortgageCommission", () => {
  it("splits 30% platform and remainder expert", () => {
    const { platformShare, expertShare } = splitMortgageCommission(100_000, 0.3);
    expect(platformShare).toBe(30_000);
    expect(expertShare).toBe(70_000);
    expect(platformShare + expertShare).toBe(100_000);
  });

  it("rounds platform share; expert gets residual", () => {
    const { platformShare, expertShare } = splitMortgageCommission(100_001, 0.3);
    expect(platformShare + expertShare).toBe(100_001);
  });
});
