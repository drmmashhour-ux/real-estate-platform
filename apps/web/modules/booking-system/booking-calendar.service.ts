import { isToday, isTomorrow } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { DEFAULT_VISIT_TIME_ZONE } from "@/lib/visits/constants";

import type { FormattedSlot } from "./booking.types";

export function groupSlotsForUi(
  slots: { start: string; end: string }[],
  timeZone: string = DEFAULT_VISIT_TIME_ZONE,
  maxSlots = 5,
): FormattedSlot[] {
  const out: FormattedSlot[] = [];
  for (const s of slots.slice(0, maxSlots)) {
    const start = new Date(s.start);
    const dayLabel = formatInTimeZone(start, timeZone, "EEEE, MMM d");
    const timeLabel = formatInTimeZone(start, timeZone, "h:mm a");
    let relativeLabel = formatInTimeZone(start, timeZone, "MMM d");
    if (isToday(start)) relativeLabel = "Today";
    else if (isTomorrow(start)) relativeLabel = "Tomorrow";

    out.push({
      startIso: s.start,
      endIso: s.end,
      dayLabel,
      timeLabel,
      relativeLabel,
    });
  }
  return out;
}

export function formatSlotListForMessage(slots: FormattedSlot[]): string {
  return slots
    .map((s) => `• ${s.relativeLabel} ${s.timeLabel}`)
    .join("\n");
}
