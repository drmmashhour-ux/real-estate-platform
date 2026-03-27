"use client";

import { createContext, useContext } from "react";
import type { UseSearchFiltersResult } from "@/hooks/useSearchFilters";

export const SearchEngineContext = createContext<UseSearchFiltersResult | null>(null);

export function useSearchEngineContext(): UseSearchFiltersResult {
  const ctx = useContext(SearchEngineContext);
  if (!ctx) {
    throw new Error("useSearchEngineContext must be used within SearchFiltersProvider or SearchEngine");
  }
  return ctx;
}
