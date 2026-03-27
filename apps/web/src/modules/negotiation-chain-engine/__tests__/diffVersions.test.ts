import { describe, expect, it } from "vitest";
import { diffVersions } from "@/src/modules/negotiation-chain-engine/application/diffVersions";

describe("diffVersions", () => {
  const t = (price: number, dep: number | null) => ({
    priceCents: price,
    depositCents: dep,
    financingTerms: { a: 1 },
    commissionTerms: {},
    deadlines: {},
  });

  it("detects price and deposit deltas", () => {
    const d = diffVersions(t(500_000_00, 10_000_00), [], t(480_000_00, 15_000_00), []);
    expect(d.priceDeltaCents).toBe(-20_000_00);
    expect(d.depositDeltaCents).toBe(5_000_00);
  });

  it("detects clause add/remove", () => {
    const d = diffVersions(
      t(100, null),
      [{ clauseType: "inspection", text: "7 days", removed: false }],
      t(100, null),
      [
        { clauseType: "inspection", text: "7 days", removed: false },
        { clauseType: "financing", text: "21 days", removed: false },
      ],
    );
    expect(d.clauseChanges.some((c) => c.kind === "added" && c.clauseType === "financing")).toBe(true);
  });

  it("detects clause modification", () => {
    const d = diffVersions(
      t(100, null),
      [{ clauseType: "inspection", text: "old", removed: false }],
      t(100, null),
      [{ clauseType: "inspection", text: "new", removed: false }],
    );
    expect(d.clauseChanges.some((c) => c.kind === "modified" && c.clauseType === "inspection")).toBe(true);
  });
});
