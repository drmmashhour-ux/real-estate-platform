import type { OfferStatus } from "@/types/offers-client";

/** Who is attempting the transition (centralized rules). */
export type OfferActorRole = "buyer" | "broker" | "admin";

const TERMINAL: OfferStatus[] = ["ACCEPTED", "REJECTED", "WITHDRAWN", "EXPIRED"];

export function isTerminalOfferStatus(s: OfferStatus): boolean {
  return TERMINAL.includes(s);
}

/**
 * Whether `next` is reachable from `current` in one step via the status endpoint
 * (excludes COUNTERED — use counter-offer flow).
 */
export function canTransitionOfferStatus(
  current: OfferStatus,
  next: OfferStatus,
  actor: OfferActorRole
): boolean {
  if (current === next) return false;
  if (isTerminalOfferStatus(current)) return false;
  if (next === "COUNTERED") return false;

  const allowed = getAllowedTransitions(current, actor);
  return allowed.includes(next);
}

export function getAllowedTransitions(current: OfferStatus, actor: OfferActorRole): OfferStatus[] {
  if (isTerminalOfferStatus(current)) return [];

  const out: OfferStatus[] = [];

  if (actor === "buyer") {
    /** Draft → submitted only via POST /api/offers or POST /api/offers/[id]/submit — not the status endpoint. */
    if (current === "SUBMITTED" || current === "UNDER_REVIEW" || current === "COUNTERED") {
      out.push("WITHDRAWN");
    }
  }

  if (actor === "broker" || actor === "admin") {
    if (current === "SUBMITTED") out.push("UNDER_REVIEW");
    if (current === "UNDER_REVIEW" || current === "COUNTERED") {
      out.push("ACCEPTED", "REJECTED");
    }
  }

  if (actor === "admin") {
    if (current === "SUBMITTED" || current === "UNDER_REVIEW" || current === "COUNTERED") {
      out.push("WITHDRAWN");
    }
  }

  return [...new Set(out)];
}

/** Broker/admin may record a counter when negotiation is in these states. */
export function canPostCounterOffer(current: OfferStatus, actor: OfferActorRole): boolean {
  if (actor !== "broker" && actor !== "admin") return false;
  return current === "UNDER_REVIEW" || current === "COUNTERED";
}
