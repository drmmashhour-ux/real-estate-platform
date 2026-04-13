/**
 * Minimal iCal (.ics) parse/format — no external deps.
 * All-day events use VALUE=DATE; DTEND is exclusive (per RFC 5545).
 */

export type ParsedICalEvent = {
  uid: string;
  summary: string;
  dtStart: Date;
  dtEndExclusive: Date;
  rawStart: string;
  rawEnd: string;
};

function unfoldIcsLines(body: string): string[] {
  const raw = body.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines: string[] = [];
  let carry = "";
  for (const line of raw.split("\n")) {
    if (line.startsWith(" ") || line.startsWith("\t")) {
      carry += line.slice(1);
    } else {
      if (carry) lines.push(carry);
      carry = line;
    }
  }
  if (carry) lines.push(carry);
  return lines;
}

function parseIcsDateParam(value: string): { date: Date; allDay: boolean } {
  const v = value.trim();
  if (v.includes("T")) {
    const m = v.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?/);
    if (m) {
      const y = +m[1];
      const mo = +m[2] - 1;
      const d = +m[3];
      const h = +m[4];
      const mi = +m[5];
      const s = +m[6];
      return { date: new Date(Date.UTC(y, mo, d, h, mi, s)), allDay: false };
    }
    const d = new Date(v);
    return { date: d, allDay: false };
  }
  const m = v.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (m) {
    const y = +m[1];
    const mo = +m[2] - 1;
    const d = +m[3];
    return { date: new Date(Date.UTC(y, mo, d, 0, 0, 0)), allDay: true };
  }
  const d = new Date(v);
  return { date: d, allDay: Number.isNaN(d.getTime()) ? false : true };
}

/** Property value after first colon (handles `UID:x` and `DTSTART;TZID=...:value`). */
function lineValue(line: string, prefix: string): string | null {
  const up = line.toUpperCase();
  const p = prefix.toUpperCase();
  if (!up.startsWith(p)) return null;
  const rest = line.slice(p.length);
  const idx = rest.indexOf(":");
  if (idx === -1) return rest.trim();
  return rest.slice(idx + 1).trim();
}

/** Parse DTSTART / DTEND allowing VALUE=DATE and TZID (ignored → UTC best-effort). */
function extractDateFromLine(line: string, key: "DTSTART" | "DTEND"): string | null {
  const up = line.toUpperCase();
  if (!up.startsWith(key)) return null;
  const colon = line.indexOf(":");
  if (colon === -1) return null;
  const params = line.slice(key.length, colon).toUpperCase();
  const value = line.slice(colon + 1).trim();
  if (params.includes("VALUE=DATE")) {
    return value.split("T")[0]?.replace(/-/g, "") ?? value;
  }
  return value;
}

/**
 * Parse VEVENT blocks from .ics body.
 */
export function parseICalEvents(icsBody: string): ParsedICalEvent[] {
  const lines = unfoldIcsLines(icsBody);
  const events: ParsedICalEvent[] = [];
  let inEvent = false;
  let buf: string[] = [];

  const flush = () => {
    if (!inEvent || buf.length === 0) return;
    let uid = "";
    let summary = "Blocked";
    let startRaw = "";
    let endRaw = "";
    for (const ln of buf) {
      const u = lineValue(ln, "UID:");
      if (u) uid = u;
      const s = lineValue(ln, "SUMMARY:");
      if (s) summary = s;
      const ds = extractDateFromLine(ln, "DTSTART");
      if (ds) startRaw = ds;
      const de = extractDateFromLine(ln, "DTEND");
      if (de) endRaw = de;
    }
    if (!startRaw) {
      buf = [];
      return;
    }
    const startP = parseIcsDateParam(startRaw.replace(/^(\d{4})(\d{2})(\d{2})$/, "$1$2$3"));
    let endExclusive: Date;
    if (endRaw) {
      const endP = parseIcsDateParam(endRaw.replace(/^(\d{4})(\d{2})(\d{2})$/, "$1$2$3"));
      endExclusive = endP.date;
      if (startP.allDay && endP.allDay) {
        const y = endExclusive.getUTCFullYear();
        const m = endExclusive.getUTCMonth();
        const d = endExclusive.getUTCDate();
        endExclusive = new Date(Date.UTC(y, m, d, 0, 0, 0));
      }
    } else {
      const d = new Date(startP.date);
      d.setUTCDate(d.getUTCDate() + 1);
      endExclusive = d;
    }
    if (!uid) uid = `gen-${startRaw}-${endRaw || "x"}-${Math.random().toString(36).slice(2)}`;
    events.push({
      uid,
      summary: summary.slice(0, 500),
      dtStart: startP.date,
      dtEndExclusive: endExclusive,
      rawStart: startRaw,
      rawEnd: endRaw,
    });
    buf = [];
  };

  for (const ln of lines) {
    const t = ln.trim();
    if (t === "BEGIN:VEVENT") {
      inEvent = true;
      buf = [];
    } else if (t === "END:VEVENT") {
      flush();
      inEvent = false;
    } else if (inEvent) {
      buf.push(ln);
    }
  }
  return events;
}

function formatIcsDateOnly(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export function buildICalDocument(vevents: { uid: string; summary: string; dtStart: Date; dtEndExclusive: Date }[]): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//BNHUB//Channel Manager//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  for (const ev of vevents) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${ev.uid}`,
      `DTSTAMP:${formatIcsDateOnly(new Date())}T000000Z`,
      `DTSTART;VALUE=DATE:${formatIcsDateOnly(ev.dtStart)}`,
      `DTEND;VALUE=DATE:${formatIcsDateOnly(ev.dtEndExclusive)}`,
      `SUMMARY:${ev.summary.replace(/\n/g, " ").replace(/,/g, "\\,")}`,
      "END:VEVENT"
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
