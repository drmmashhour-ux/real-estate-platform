import type { BookingStatus } from "@prisma/client";

export type BookingTransitionActor = "guest" | "host" | "admin" | "system";

/**
 * Central guard for booking status changes. Routes should respect this matrix before writing.
 * Pairs with `manualPaymentSettlement` for Syria-style flows (see `lib/bnhub/booking.ts`).
 */
export function canTransitionBookingStatus(
  from: BookingStatus,
  to: BookingStatus,
  ctx: { paymentMode: "online" | "manual"; actor: BookingTransitionActor },
): boolean {
  const { actor, paymentMode } = ctx;
  const admin = actor === "admin";
  const host = actor === "host";
  const guest = actor === "guest";
  const system = actor === "system";

  const allow = (pairs: [BookingStatus, BookingStatus][]) =>
    pairs.some(([a, b]) => a === from && b === to);

  if (from === to) return true;

  if (to === "CANCELLED" || to === "CANCELLED_BY_GUEST" || to === "CANCELLED_BY_HOST") {
    if (admin) return true;
    if (to === "CANCELLED_BY_GUEST" && guest) return from !== "COMPLETED" && from !== "DECLINED";
    if (to === "CANCELLED_BY_HOST" && host) return from !== "COMPLETED";
    return false;
  }

  if (allow([["PENDING", "CONFIRMED"]])) {
    if (paymentMode === "online") return system || admin;
    return host || admin;
  }

  if (allow([["AWAITING_HOST_APPROVAL", "PENDING"]])) {
    return host || admin;
  }

  if (allow([["AWAITING_HOST_APPROVAL", "DECLINED"]])) {
    return host || admin;
  }

  if (allow([["AWAITING_HOST_APPROVAL", "CONFIRMED"]])) {
    return admin;
  }

  if (allow([["PENDING", "AWAITING_HOST_APPROVAL"]])) {
    return guest || admin;
  }

  if (allow([["CONFIRMED", "COMPLETED"]])) {
    return admin || host;
  }

  if (allow([["CONFIRMED", "DISPUTED"]])) {
    return admin || guest || host;
  }

  return admin;
}
