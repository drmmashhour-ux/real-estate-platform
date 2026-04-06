import type { ActivePaymentMode } from "./types";

/** High-level orchestrated payment session states (not Prisma enums). */
export type OrchestratedCheckoutPhase = "none" | "created" | "redirected" | "paid" | "failed" | "cancelled";

export function nextCheckoutPhase(
  current: OrchestratedCheckoutPhase,
  event: "session_created" | "redirect" | "webhook_paid" | "webhook_unpaid" | "user_cancel",
  mode: ActivePaymentMode,
): OrchestratedCheckoutPhase {
  if (mode === "manual") return "none";
  switch (event) {
    case "session_created":
      return current === "none" ? "created" : current;
    case "redirect":
      return current === "created" || current === "redirected" ? "redirected" : current;
    case "webhook_paid":
      return "paid";
    case "webhook_unpaid":
      return current === "paid" ? "paid" : "failed";
    case "user_cancel":
      return current === "paid" ? "paid" : "cancelled";
    default:
      return current;
  }
}
