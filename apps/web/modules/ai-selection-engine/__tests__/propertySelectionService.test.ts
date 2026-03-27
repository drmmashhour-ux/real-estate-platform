import { describe, expect, it } from "vitest";
import { selectPropertyCategoryWinners } from "@/src/modules/ai-selection-engine/infrastructure/propertySelectionService";

describe("propertySelectionService", () => {
  it("returns one deterministic winner per category", () => {
    const rows = [
      { id: "a", city: "Toronto", title: "A", priceCents: 10000000, trustScore: 80, riskScore: 25, listingDealType: "SALE", dealScore: 88, confidence: 76, roi: 6.5, personalization: 80 },
      { id: "b", city: "Montreal", title: "B", priceCents: 9000000, trustScore: 60, riskScore: 40, listingDealType: "RENT_SHORT", dealScore: 72, confidence: 65, roi: 9.2, personalization: 55 },
    ];

    const winners = selectPropertyCategoryWinners(rows);
    expect(winners.bestDeal).toBeDefined();
    expect(winners.safest).toBeDefined();
    expect(winners.cashflow).toBeDefined();
    expect(winners.longTerm).toBeDefined();
    expect(winners.bnhub).toBeDefined();
    expect(winners.bestDeal?.score).toBe(selectPropertyCategoryWinners(rows).bestDeal?.score);
  });
});
