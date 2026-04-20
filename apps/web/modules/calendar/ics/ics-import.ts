import ical from "node-ical";
import type { IcsEventShape } from "./ics.types";

function assertHttpUrl(url: string): void {
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    throw new Error("Invalid ICS URL");
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new Error("ICS URL must use http or https");
  }
}

function toDate(v: unknown): Date | null {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
  return null;
}

/**
 * Fetch and parse a remote ICS feed (Airbnb / Booking.com / Vrbo export URLs).
 */
export async function parseRemoteIcs(url: string): Promise<IcsEventShape[]> {
  assertHttpUrl(url);

  const data = await ical.async.fromURL(url, {
    headers: { Accept: "text/calendar, application/ics, */*" },
  });

  const events: IcsEventShape[] = [];

  for (const key of Object.keys(data)) {
    const item = data[key] as {
      type?: string;
      start?: unknown;
      end?: unknown;
      uid?: string;
      summary?: string;
      status?: string;
    };

    if (!item || item.type !== "VEVENT") continue;

    const start = toDate(item.start);
    const end = toDate(item.end);
    if (!start || !end || !(start < end)) continue;

    events.push({
      uid: (typeof item.uid === "string" && item.uid.trim()) || key,
      title: typeof item.summary === "string" && item.summary.trim() ? item.summary.trim() : "Blocked",
      start,
      end,
      status: typeof item.status === "string" ? item.status : "CONFIRMED",
      raw: item,
    });
  }

  return events;
}
