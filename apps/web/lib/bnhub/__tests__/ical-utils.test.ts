import { describe, expect, it } from "vitest";
import { buildICalDocument, parseICalEvents } from "../ical-utils";

describe("ical-utils", () => {
  it("parses all-day VEVENT with DTEND exclusive", () => {
    const ics = [
      "BEGIN:VCALENDAR",
      "BEGIN:VEVENT",
      "UID:test-1",
      "DTSTART;VALUE=DATE:20260110",
      "DTEND;VALUE=DATE:20260112",
      "SUMMARY:Guest stay",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const evs = parseICalEvents(ics);
    expect(evs).toHaveLength(1);
    expect(evs[0].uid).toBe("test-1");
    expect(evs[0].summary).toBe("Guest stay");
    expect(evs[0].dtStart.toISOString().slice(0, 10)).toBe("2026-01-10");
    const endEx = evs[0].dtEndExclusive.toISOString().slice(0, 10);
    expect(endEx).toBe("2026-01-12");
  });

  it("builds valid calendar with one event", () => {
    const start = new Date(Date.UTC(2026, 0, 5));
    const endEx = new Date(Date.UTC(2026, 0, 8));
    const doc = buildICalDocument([
      { uid: "x@bnhub", summary: "Booked", dtStart: start, dtEndExclusive: endEx },
    ]);
    expect(doc).toContain("BEGIN:VCALENDAR");
    expect(doc).toContain("DTSTART;VALUE=DATE:20260105");
    expect(doc).toContain("DTEND;VALUE=DATE:20260108");
    expect(doc).toContain("SUMMARY:Booked");
  });
});
