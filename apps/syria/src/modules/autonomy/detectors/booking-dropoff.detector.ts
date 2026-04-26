import type { DarlinkMarketplaceSnapshot } from "../darlink-marketplace-autonomy.types";
import type { MarketplaceSignal } from "../darlink-marketplace-autonomy.types";
import type { DarlinkMarketplaceDetector } from "./detector.types";
import { signalKey } from "./detector-utils";

export const bookingDropoffDetector: DarlinkMarketplaceDetector = {
  id: "booking_dropoff",
  run(snapshot: DarlinkMarketplaceSnapshot): MarketplaceSignal[] {
    const out: MarketplaceSignal[] = [];
    try {
      for (const b of snapshot.bookings) {
        if (b.status === "CONFIRMED" || b.status === "PENDING") {
          const unpaid =
            b.guestPaymentStatus === "UNPAID" ||
            b.guestPaymentStatus === "PENDING_MANUAL";
          if (unpaid && b.status === "CONFIRMED") {
            const id = signalKey("booking_dropoff", "booking", b.id, "confirmed_unpaid_inconsistent");
            out.push({
              id,
              type: "booking_dropoff",
              severity: "critical",
              entityType: "booking",
              entityId: b.id,
              reasonCode: "confirmed_unpaid_inconsistent",
              metrics: { guestPaymentStatus: 1 },
              explanation: "Booking confirmed but guest payment not verified — reconcile state manually.",
            });
          }
          if (b.status === "PENDING" && unpaid) {
            const id = signalKey("booking_dropoff", "booking", b.id, "pending_unpaid");
            out.push({
              id,
              type: "booking_dropoff",
              severity: "warning",
              entityType: "booking",
              entityId: b.id,
              reasonCode: "pending_unpaid",
              metrics: { pending: 1 },
              explanation: "Booking pending with guest unpaid — monitor friction.",
            });
          }
        }
      }
    } catch {
      /* empty */
    }
    return out;
  },
};
