/** Shared empty state when browse/search filters return no listings — keep messaging consistent. */
export const BROWSE_EMPTY_LISTINGS = {
  title: "No stays match this search",
  description:
    "Try widening your map area, relaxing dates or price, clearing a filter, or searching a nearby city.",
} as const;
