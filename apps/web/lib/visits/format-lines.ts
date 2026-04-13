import { formatInTimeZone } from "date-fns-tz";
import { DEFAULT_VISIT_TIME_ZONE } from "@/lib/visits/constants";

export function formatVisitSummaryLine(opts: {
  kind: "requested" | "accepted" | "rejected" | "rescheduled";
  listingTitle: string;
  start: Date;
  end: Date;
  timeZone?: string;
}): string {
  const tz = opts.timeZone ?? DEFAULT_VISIT_TIME_ZONE;
  const range = `${formatInTimeZone(opts.start, tz, "EEE MMM d, yyyy '·' h:mm a")} – ${formatInTimeZone(
    opts.end,
    tz,
    "h:mm a"
  )} (${tz})`;
  const title = opts.listingTitle.trim().slice(0, 80);
  if (opts.kind === "requested") {
    return `📅 Visit requested for “${title}”: ${range}. The broker will confirm shortly.`;
  }
  if (opts.kind === "accepted") {
    return `✅ Visit confirmed for “${title}”: ${range}.`;
  }
  if (opts.kind === "rejected") {
    return `Visit request for “${title}” (${range}) was declined. Message the broker for other options.`;
  }
  return `📅 Visit rescheduled for “${title}”: ${range}.`;
}
