import type { PostingTimeSlot } from "./marketing-ai.types";

/** Max suggested posts per calendar day for semi-autonomous mode */
export const DEFAULT_MAX_POSTS_PER_DAY = 2;

const MORNING_LABEL = "morning" as const;
const EVENING_LABEL = "evening" as const;

/** Rotate recommended clock windows (local) — simple heuristic */
export function suggestPostingSlot(
  dayOffset: number,
  takenInDay: PostingTimeSlot[],
  preferred?: Partial<Record<PostingTimeSlot, number>>
): PostingTimeSlot {
  const morningW = preferred?.morning ?? 1;
  const eveningW = preferred?.evening ?? 1;
  const preferMorning = dayOffset % 2 === 0;
  const candidates: PostingTimeSlot[] = [];
  if (preferMorning) {
    candidates.push(MORNING_LABEL, EVENING_LABEL);
  } else {
    candidates.push(EVENING_LABEL, MORNING_LABEL);
  }
  for (const c of candidates) {
    if (!takenInDay.includes(c)) {
      if (c === MORNING_LABEL && morningW <= 0) continue;
      if (c === EVENING_LABEL && eveningW <= 0) continue;
      return c;
    }
  }
  return takenInDay.includes(MORNING_LABEL) ? EVENING_LABEL : MORNING_LABEL;
}

/** Build up to `totalSlots` assignments across 7 days without exceeding per-day cap */
export function distributeWeeklySlots(
  totalSlots: number,
  maxPerDay = DEFAULT_MAX_POSTS_PER_DAY
): { dayOffset: number; slotInDayIndex: number }[] {
  const out: { dayOffset: number; slotInDayIndex: number }[] = [];
  let remaining = Math.max(0, totalSlots);
  let d = 0;
  while (remaining > 0 && d < 7) {
    const dayCount = Math.min(maxPerDay, remaining);
    for (let i = 0; i < dayCount; i++) {
      out.push({ dayOffset: d, slotInDayIndex: i });
      remaining--;
      if (remaining <= 0) break;
    }
    d++;
  }
  return out;
}
