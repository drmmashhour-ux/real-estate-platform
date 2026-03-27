import { describe, expect, it } from "vitest";
import { rerunPhase2BodySchema } from "@/modules/deal-analyzer/api/phase2Schemas";

describe("phase2 API schemas", () => {
  it("accepts empty body", () => {
    const p = rerunPhase2BodySchema.safeParse({});
    expect(p.success).toBe(true);
  });

  it("accepts financing with null principal", () => {
    const p = rerunPhase2BodySchema.safeParse({
      financing: { loanPrincipalCents: null, annualRate: 0.06, termYears: 25 },
    });
    expect(p.success).toBe(true);
  });

  it("rejects invalid shortTermListingId type", () => {
    const p = rerunPhase2BodySchema.safeParse({ shortTermListingId: 123 });
    expect(p.success).toBe(false);
  });
});
