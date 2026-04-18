import { engineFlags } from "@/config/feature-flags";

export function isRankingV2Enabled(): boolean {
  return engineFlags.rankingV2 === true;
}
