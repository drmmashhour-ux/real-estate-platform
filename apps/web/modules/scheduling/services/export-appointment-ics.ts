import type { Appointment } from "@prisma/client";

/** Prep for downloadable .ics — return minimal ICS-shaped text later. */
export function buildAppointmentIcsPlaceholder(appt: Appointment): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//platform//appointments//EN",
    "BEGIN:VEVENT",
    `UID:${appt.id}@platform`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
    `SUMMARY:${appt.title.replace(/[,;\\]/g, "")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}
