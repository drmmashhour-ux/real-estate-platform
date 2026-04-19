/**
 * Lightweight cross-priority history — delegates to execution state store (bounded list).
 */

import type { PlatformImprovementHistoryEvent } from "./platform-improvement-state.service";
import { listRecentHistory } from "./platform-improvement-state.service";

export type PlatformImprovementHistoryEntry = PlatformImprovementHistoryEvent;

export function listRecentPlatformImprovementHistory(limit = 50): PlatformImprovementHistoryEntry[] {
  return listRecentHistory(limit);
}
