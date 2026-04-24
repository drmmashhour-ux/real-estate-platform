"use client";

import type { GreenSearchFilters, GreenRankingSortMode } from "@/modules/green-ai/green-search.types";
import { GreenFilterSection } from "@/components/listings/GreenFilterSection";

type Props = {
  greenFilters: GreenSearchFilters;
  onGreenFilters: (f: GreenSearchFilters) => void;
  sortMode: GreenRankingSortMode | null;
  onSortMode: (m: GreenRankingSortMode | null) => void;
};

/** Broker / admin: stronger labels on the same filter block. */
export function GreenRankingControls({ greenFilters, onGreenFilters, sortMode, onSortMode }: Props) {
  return (
    <GreenFilterSection
      greenFilters={greenFilters}
      onChange={onGreenFilters}
      sortMode={sortMode}
      onSortMode={onSortMode}
      brokerView
    />
  );
}
