export type MapInsightStats = {
  count: number;
  medianPrice: number;
  minPrice: number;
  maxPrice: number;
  soldCount: number;
  pendingCount: number;
  activeCount: number;
};

function fmtMoney(n: number, dealKind: "sale" | "rent"): string {
  const rounded = Math.round(n);
  const s = rounded.toLocaleString("en-CA");
  return dealKind === "rent" ? `$${s}/mo` : `$${s}`;
}

/**
 * Deterministic narrative when OpenAI is off or fails — uses only aggregate stats (no addresses).
 */
export function buildRuleBasedMapInsight(
  stats: MapInsightStats,
  dealKind: "sale" | "rent",
  city?: string
): string {
  const loc = city?.trim() ? ` around ${city.trim()}` : " in this map view";
  const unit = dealKind === "rent" ? "rents" : "asking prices";
  const spread =
    stats.maxPrice > stats.minPrice
      ? fmtMoney(stats.maxPrice - stats.minPrice, dealKind)
      : "a narrow band";

  const parts: string[] = [];
  parts.push(
    `You’re looking at ${stats.count} propert${stats.count === 1 ? "y" : "ies"}${loc} with map pins. ` +
      `Typical ${unit} cluster near ${fmtMoney(stats.medianPrice, dealKind)} (median). ` +
      `The spread from lowest to highest is about ${spread}.`
  );

  if (stats.soldCount > 0) {
    parts.push(
      ` ${stats.soldCount} ${stats.soldCount === 1 ? "shows" : "show"} as sold or closed — useful as a benchmark, but verify status on the listing.`
    );
  }
  if (stats.pendingCount > 0) {
    parts.push(
      ` ${stats.pendingCount} ${stats.pendingCount === 1 ? "has" : "have"} an offer in progress — expect faster movement if you’re competing.`
    );
  }
  if (stats.activeCount > 0 && stats.medianPrice > 0) {
    parts.push(
      ` Listings clearly under the median can signal motivation or a trade-off (condition, location); above-median asks often reflect size, renovation, or rarity — compare photos and details before deciding.`
    );
  }

  parts.push(
    " This is not a valuation — talk to a licensed broker for an opinion of market value."
  );

  return parts.join("");
}
