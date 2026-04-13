import type { ContentMachineStyle } from "@prisma/client";

/** Core cohort analysis (shared with legacy `content-machine/optimization`). */
export type ContentOptimizationSignals = {
  percentile: number;
  cohortSize: number;
  totalPieces: number;
  cohortScoreSum: number;
  stylesRanked: { style: ContentMachineStyle; scoreSum: number; count: number }[];
  hookExamples: string[];
  cohortListingIds: string[];
};

export type CtaBucketStat = { bucket: string; scoreSum: number; count: number };
export type VisualOrderStat = { key: string; avgScore: number; count: number };
export type CityStyleStat = { cityKey: string; topStyle: ContentMachineStyle; scoreSum: number; pieces: number };

export type ExtendedOptimizationSignals = ContentOptimizationSignals & {
  ctaBuckets: CtaBucketStat[];
  visualOrderStats: VisualOrderStat[];
  cityStyleHints: CityStyleStat[];
  worstHookExamples: string[];
};
