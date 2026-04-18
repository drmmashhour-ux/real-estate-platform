/**
 * Ranking V8 Phase C — controlled influence (bounded reorder; live scores unchanged in source path).
 */

export type RankingV8InfluenceResult = {
  applied: boolean;
  /** True when gates suggest observation without reorder (weak signals / instability-only path). */
  monitorOnly: boolean;
  skippedReason?: string;
  boostsApplied: number;
  downranksApplied: number;
  swapsSkipped: number;
  observationalWarnings: string[];
  reasonSummary: string;
};
