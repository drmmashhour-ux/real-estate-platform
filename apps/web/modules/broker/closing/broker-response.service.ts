/**
 * Advisory response-speed label — unlock → first contact delta when available; else last-contact cadence.
 */

import type { LeadClosingState, ResponseSpeedLabel } from "./broker-closing.types";

export type ResponseSpeedInput = {
  state: LeadClosingState;
  contactUnlockedAt?: string | null;
  firstContactAt?: string | null;
  nowMs?: number;
};

const MS_HOUR = 60 * 60 * 1000;

/** Fast / average / slow — heuristic only; not a performance score for users. */
export function computeResponseSpeedScore(input: ResponseSpeedInput): ResponseSpeedLabel {
  const nowMs = input.nowMs ?? Date.now();
  const unlock = input.contactUnlockedAt ? Date.parse(input.contactUnlockedAt) : NaN;
  const first = input.firstContactAt ? Date.parse(input.firstContactAt) : NaN;

  if (!Number.isNaN(unlock) && !Number.isNaN(first)) {
    const hours = (first - unlock) / MS_HOUR;
    if (hours <= 4) return "fast";
    if (hours <= 24) return "average";
    return "slow";
  }

  if (input.state.lastContactAt) {
    const last = Date.parse(input.state.lastContactAt);
    if (!Number.isNaN(last)) {
      const since = (nowMs - last) / MS_HOUR;
      if (since <= 24) return "fast";
      if (since <= 72) return "average";
      return "slow";
    }
  }

  return "average";
}
