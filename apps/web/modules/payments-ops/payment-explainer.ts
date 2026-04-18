import type { LecipmPaymentKind, LecipmPaymentRecordStatus } from "@prisma/client";

export function explainPaymentStatus(kind: LecipmPaymentKind, status: LecipmPaymentRecordStatus): string {
  const base = `${kind.replace(/_/g, " ")} — ${status.replace(/_/g, " ")}`;
  if (status === "awaiting_confirmation") {
    return `${base}. Awaiting authorized confirmation with evidence — not verified until recorded.`;
  }
  if (status === "confirmed" || status === "held") {
    return `${base}. Confirmed/held per recorded events — verify against bank/trust records outside LECIPM.`;
  }
  if (status === "released" || status === "refunded") {
    return `${base}. Terminal state logged — retain external proof in your file.`;
  }
  return base + ".";
}
