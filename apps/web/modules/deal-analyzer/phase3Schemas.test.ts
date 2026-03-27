import { describe, expect, it } from "vitest";
import {
  runAffordabilityBodySchema,
  addWatchlistItemBodySchema,
  createWatchlistBodySchema,
} from "@/modules/deal-analyzer/api/phase3Schemas";

describe("phase3Schemas", () => {
  it("rejects out-of-range annual rate", () => {
    const r = runAffordabilityBodySchema.safeParse({ annualRate: 0.5 });
    expect(r.success).toBe(false);
  });

  it("accepts watchlist item", () => {
    const r = addWatchlistItemBodySchema.safeParse({ propertyId: "clxyz123" });
    expect(r.success).toBe(true);
  });

  it("accepts watchlist name", () => {
    const r = createWatchlistBodySchema.safeParse({ name: "Targets" });
    expect(r.success).toBe(true);
  });
});
