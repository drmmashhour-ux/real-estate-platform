import { describe, expect, it } from "vitest";
import { diffVersions } from "@/src/modules/negotiation-chain-engine/application/diffVersions";
import { formatNegotiationDiffSummary } from "@/src/modules/negotiation-chain-engine/application/negotiationDiffFormat";

describe("formatNegotiationDiffSummary", () => {
  it("summarizes structured diff fields factually", () => {
    const d = diffVersions(
      {
        priceCents: 500_000_00,
        depositCents: 25_000_00,
        financingTerms: { a: 1 },
        commissionTerms: {},
        deadlines: {},
      },
      [],
      {
        priceCents: 495_000_00,
        depositCents: 20_000_00,
        financingTerms: { a: 2 },
        commissionTerms: {},
        deadlines: {},
      },
      [],
    );
    const lines = formatNegotiationDiffSummary(d);
    expect(lines.some((l) => l.includes("Price"))).toBe(true);
    expect(lines.some((l) => l.includes("Deposit") || l.includes("deposit"))).toBe(true);
    expect(lines.some((l) => l.includes("Financing"))).toBe(true);
  });
});
