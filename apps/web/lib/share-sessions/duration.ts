export type ShareDurationPreset = "1h" | "8h" | "until_checkin" | "until_checkout";

export function parseDurationPreset(raw: unknown): ShareDurationPreset | null {
  if (typeof raw !== "string") return null;
  const u = raw.trim().toLowerCase();
  if (u === "1h" || u === "1_hour") return "1h";
  if (u === "8h" || u === "8_hours") return "8h";
  if (u === "until_checkin" || u === "checkin") return "until_checkin";
  if (u === "until_checkout" || u === "checkout") return "until_checkout";
  return null;
}

export function computeExpiresAt(
  preset: ShareDurationPreset,
  checkIn: Date,
  checkOut: Date
): Date {
  const now = Date.now();
  switch (preset) {
    case "1h":
      return new Date(now + 60 * 60 * 1000);
    case "8h":
      return new Date(now + 8 * 60 * 60 * 1000);
    case "until_checkin":
      return new Date(Math.max(checkIn.getTime(), now + 60 * 1000));
    case "until_checkout":
      return new Date(Math.max(checkOut.getTime(), now + 60 * 1000));
    default:
      return new Date(now + 60 * 60 * 1000);
  }
}
