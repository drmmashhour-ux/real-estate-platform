import type { ListingAvailability } from "@/lib/booking/availability-core";
import { availabilityUrgencyMessage } from "@/lib/booking/availability-core";

function fmtDate(d: Date, locale: string) {
  try {
    return d.toLocaleDateString(locale || "en", { month: "long", day: "numeric" });
  } catch {
    return d.toLocaleDateString("en", { month: "long", day: "numeric" });
  }
}

type Props = {
  availability: ListingAvailability;
  /** e.g. `en-CA` */
  locale?: string;
  variant?: "dark" | "light";
};

/**
 * Real booking-based copy only (Order A.1) — no invented scarcity. Shown above booking / “calendar” area.
 */
export function ListingAvailabilityBlock({ availability, locale = "en", variant = "dark" }: Props) {
  const { nextAvailableDate, occupancyRate } = availability;
  const pct = Math.min(100, Math.max(0, Math.round(occupancyRate * 100)));
  const urgency = availabilityUrgencyMessage(occupancyRate);
  const isDark = variant === "dark";
  const sub = isDark ? "text-white/50" : "text-zinc-500";
  const em = isDark ? "text-amber-200/90" : "text-amber-800";

  return (
    <div className="space-y-1.5 text-sm" data-testid="listing-availability-block">
      {nextAvailableDate ? (
        <p className={isDark ? "text-white/85" : "text-zinc-800"}>
          <span className={sub}>Next available: </span>
          <span className="font-medium">{fmtDate(nextAvailableDate, locale)}</span>
        </p>
      ) : (
        <p className={isDark ? "text-white/60" : "text-zinc-600"}>No check-in date available in the current calendar window.</p>
      )}
      <p className={isDark ? "text-white/80" : "text-zinc-700"}>
        <span className={sub}>This month: </span>
        <span className="font-medium tabular-nums">{pct}%</span>
        <span className={sub}> of nights have been reserved (last 30 days)</span>
      </p>
      {urgency ? <p className={`font-medium ${em}`}>{urgency}</p> : null}
    </div>
  );
}
