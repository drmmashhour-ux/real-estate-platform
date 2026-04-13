import { Eye, Flame, Users, Zap } from "lucide-react";

/**
 * Above-the-fold urgency — views, weekly booking velocity, scarcity.
 */
export function BnhubListingUrgencyStrip({
  viewsToday,
  limitedAvailability,
  bookingsThisWeek = 0,
  compact = false,
}: {
  viewsToday: number;
  limitedAvailability: boolean;
  /** Confirmed / in-progress bookings created in the last 7 days for this listing */
  bookingsThisWeek?: number;
  compact?: boolean;
}) {
  const n = Math.max(0, viewsToday);
  const viewLabel =
    n === 0
      ? "Travelers are viewing similar stays"
      : n === 1
        ? "1 person viewed this recently"
        : `${n.toLocaleString()} people viewed this`;

  const chip = compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";

  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? "" : "mt-2"}`} role="status" aria-live="polite">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white font-medium text-slate-800 shadow-sm ring-1 ring-black/[0.04] ${chip}`}
      >
        <Eye className="h-3.5 w-3.5 shrink-0 text-[#006ce4]" aria-hidden strokeWidth={2} />
        {viewLabel}
      </span>
      {bookingsThisWeek > 0 ? (
        <span
          className={`inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 font-semibold text-emerald-950 ${chip}`}
        >
          <Zap className="h-3.5 w-3.5 shrink-0 text-emerald-600" aria-hidden strokeWidth={2} />
          Booked {bookingsThisWeek} time{bookingsThisWeek === 1 ? "" : "s"} this week
        </span>
      ) : null}
      {limitedAvailability ? (
        <span
          className={`inline-flex items-center gap-1 rounded-full border border-amber-300/90 bg-amber-50 font-semibold text-amber-950 ${chip}`}
        >
          <Flame className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden strokeWidth={2} />
          Only a few openings left
        </span>
      ) : null}
      {limitedAvailability && viewsToday >= 4 ? (
        <span
          className={`inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 font-medium text-slate-800 ${chip}`}
        >
          <Users className="h-3.5 w-3.5 shrink-0 text-slate-600" aria-hidden strokeWidth={2} />
          High interest — check dates soon
        </span>
      ) : null}
    </div>
  );
}
