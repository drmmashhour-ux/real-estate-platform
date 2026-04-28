import type { SybnbBooking } from "@/generated/prisma";
import { prisma } from "@/lib/db";
import { logSybnbEvent } from "@/lib/sybnb/sybnb-audit";

/** Visual-only simulated escrow — no PSP funds. */
export const SYBNB_SIM_ESCROW_PENDING = "simulated_pending" as const;
export const SYBNB_SIM_ESCROW_SECURED = "simulated_secured" as const;
export const SYBNB_SIM_ESCROW_RELEASED = "simulated_released" as const;

export type SybnbSimulatedEscrowState =
  | typeof SYBNB_SIM_ESCROW_PENDING
  | typeof SYBNB_SIM_ESCROW_SECURED
  | typeof SYBNB_SIM_ESCROW_RELEASED;

/**
 * Effective simulated escrow for UI + transitions.
 * Legacy rows: approved hosts without a stored value behave as pending once approved.
 */
export function getEffectiveSimulatedEscrowStatus(
  booking: Pick<SybnbBooking, "status" | "sybnbSimulatedEscrowStatus">,
): SybnbSimulatedEscrowState | null {
  const stored = booking.sybnbSimulatedEscrowStatus?.trim();
  if (
    stored === SYBNB_SIM_ESCROW_PENDING ||
    stored === SYBNB_SIM_ESCROW_SECURED ||
    stored === SYBNB_SIM_ESCROW_RELEASED
  ) {
    return stored;
  }
  const s = booking.status;
  if (s === "declined" || s === "cancelled" || s === "requested") return null;
  // Legacy rows before column existed — manual phase only (visual pending).
  if (s === "approved" || s === "payment_pending" || s === "needs_review" || s === "confirmed") {
    return SYBNB_SIM_ESCROW_PENDING;
  }
  return null;
}

function checkInDateUtcMidnight(checkIn: Date): Date {
  const d = new Date(checkIn);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function todayUtcMidnight(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * After check-in day (UTC), advance secured → released (simulated). Idempotent.
 */
export async function syncSybnbSimulatedEscrowReleased(bookingId: string): Promise<void> {
  const b = await prisma.sybnbBooking.findUnique({ where: { id: bookingId.trim() } });
  if (!b) return;
  if (b.sybnbSimulatedEscrowStatus !== SYBNB_SIM_ESCROW_SECURED) return;
  if (todayUtcMidnight() < checkInDateUtcMidnight(b.checkIn)) return;

  await prisma.sybnbBooking.update({
    where: { id: b.id },
    data: { sybnbSimulatedEscrowStatus: SYBNB_SIM_ESCROW_RELEASED },
  });

  await logSybnbEvent({
    action: "ESCROW_RELEASED",
    bookingId: b.id,
    userId: null,
    actorRole: "system",
    metadata: {
      simulated: true,
      checkIn: b.checkIn.toISOString().slice(0, 10),
    },
  });
}
