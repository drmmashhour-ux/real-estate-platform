import type { ImmoContactEventTypeValue } from "@/types/immo-contact-events";

/** Best-effort client beacon for ImmoContact compliance logs (never throws). */
export function trackImmoContactClient(payload: {
  listingId: string;
  listingKind: "fsbo" | "crm" | "bnhub";
  contactType: ImmoContactEventTypeValue;
  metadata?: Record<string, unknown>;
}) {
  void fetch("/api/immo/track", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}
