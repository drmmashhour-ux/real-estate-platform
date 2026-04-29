import { getTranslations } from "next-intl/server";
import type { SybnbBooking } from "@/generated/prisma";
import {
  SYBNB_SIM_ESCROW_PENDING,
  SYBNB_SIM_ESCROW_SECURED,
  SYBNB_SIM_ESCROW_RELEASED,
  getEffectiveSimulatedEscrowStatus,
} from "@/lib/sybnb/sybnb-simulated-escrow";
import { EscrowMarkPaidButton } from "@/components/sybnb/EscrowMarkPaidButton";

type Props = {
  booking: Pick<
    SybnbBooking,
    "id" | "status" | "sybnbSimulatedEscrowStatus" | "checkIn" | "checkOut"
  >;
  isHost: boolean;
};

/**
 * Simulated “platform-secured payment” trust UI — no funds held or transmitted by SYBNB.
 *
 * Placement: booking request page — below {@link BookingTimeline}, above {@link ChatBox}.
 */
export async function EscrowStatus({ booking, isHost }: Props) {
  const eff = getEffectiveSimulatedEscrowStatus(booking);
  if (!eff) return null;

  const t = await getTranslations("Sybnb.escrow");

  const stateLine =
    eff === SYBNB_SIM_ESCROW_PENDING
      ? t("pending")
      : eff === SYBNB_SIM_ESCROW_SECURED
        ? t("secured")
        : t("released");

  const guestExtra =
    !isHost && eff === SYBNB_SIM_ESCROW_SECURED
      ? t("securedGuestHint")
      : !isHost && eff === SYBNB_SIM_ESCROW_RELEASED
        ? t("releasedGuestHint")
        : null;

  const showMarkPaid =
    isHost &&
    eff === SYBNB_SIM_ESCROW_PENDING &&
    (booking.sybnbSimulatedEscrowStatus == null ||
      booking.sybnbSimulatedEscrowStatus === SYBNB_SIM_ESCROW_PENDING);

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-5 shadow-sm [dir=rtl]:text-right">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900">{t("bannerTitle")}</p>
      <p className="mt-2 text-sm font-medium text-emerald-950">{t("trustLine")}</p>
      <p className="mt-2 rounded-lg bg-white/80 px-3 py-2 text-xs font-semibold text-amber-950 ring-1 ring-amber-200">
        {t("simulationDisclaimer")}
      </p>
      <p className="mt-4 text-sm text-neutral-900">{stateLine}</p>
      {guestExtra ? <p className="mt-2 text-xs text-neutral-700">{guestExtra}</p> : null}
      {showMarkPaid ? <EscrowMarkPaidButton bookingId={booking.id} /> : null}
    </div>
  );
}
