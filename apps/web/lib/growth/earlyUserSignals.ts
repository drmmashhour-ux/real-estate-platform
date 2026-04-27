import { getEarlyUserCountCached } from "@/lib/growth/earlyUsers";

import {
  buildEarlyUserSignalsFromCount,
  earlyUserHeroSubline,
  earlyUserOnboardingHeadline,
} from "./earlyUserSignalsLogic";
import type { EarlyUserSignals } from "./earlyUserSignalsLogic";

export type { EarlyUserSignals };
export { buildEarlyUserSignalsFromCount, earlyUserHeroSubline, earlyUserOnboardingHeadline };

/** One DB read — `COUNT(*)` on `EarlyUser` (Order 44 / 45; real count only). */
export async function getEarlyUserSignals(): Promise<EarlyUserSignals> {
  const count = await getEarlyUserCountCached();
  return buildEarlyUserSignalsFromCount(count);
}
