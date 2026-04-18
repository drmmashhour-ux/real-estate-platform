import { RANKING_V2_QUALITY_FLOOR, RANKING_V2_TRUST_FLOOR } from "../constants";

export function featuredBoost01(params: {
  featuredActive: boolean;
  trust01: number;
  quality01: number;
}): number {
  if (!params.featuredActive) return 0;
  if (params.trust01 < RANKING_V2_TRUST_FLOOR || params.quality01 < RANKING_V2_QUALITY_FLOOR) return 0;
  return 0.72;
}
