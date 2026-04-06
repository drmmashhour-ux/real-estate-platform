import type { MonitoringTimeRange } from "./types";

export function boundsForMonitoringRange(range: MonitoringTimeRange): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date(end);
  if (range === "today") {
    start.setUTCHours(0, 0, 0, 0);
  } else if (range === "7d") {
    start.setUTCDate(start.getUTCDate() - 7);
  } else {
    start.setUTCDate(start.getUTCDate() - 30);
  }
  return { start, end };
}
