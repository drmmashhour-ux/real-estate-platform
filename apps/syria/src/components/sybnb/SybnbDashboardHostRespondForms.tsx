"use client";

import { hostRespondSybnbBooking } from "@/actions/sybnb-booking";
import { triggerNarration } from "@/lib/demo/narrator";

type Props = {
  bookingId: string;
  confirmLabel: string;
  declineLabel: string;
};

/** Host confirm / decline — narration hook on confirm only (deterministic copy). */
export function SybnbDashboardHostRespondForms({ bookingId, confirmLabel, declineLabel }: Props) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <form
        action={hostRespondSybnbBooking}
        onSubmit={() => {
          triggerNarration("ACTION_HOST_CONFIRM");
        }}
      >
        <input type="hidden" name="bookingId" value={bookingId} />
        <input type="hidden" name="action" value="confirm" />
        <button
          type="submit"
          className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-800"
        >
          {confirmLabel}
        </button>
      </form>
      <form action={hostRespondSybnbBooking}>
        <input type="hidden" name="bookingId" value={bookingId} />
        <input type="hidden" name="action" value="decline" />
        <button
          type="submit"
          className="rounded-lg border border-stone-300 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-800 hover:bg-stone-100"
        >
          {declineLabel}
        </button>
      </form>
    </div>
  );
}
