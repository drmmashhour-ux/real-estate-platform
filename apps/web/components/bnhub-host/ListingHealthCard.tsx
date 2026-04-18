"use client";

export function ListingHealthCard({
  occupancyPct,
  bookingsThisMonth,
}: {
  occupancyPct: number;
  bookingsThisMonth: number;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <p className="text-xs uppercase tracking-wide text-neutral-500">Occupancy / activity</p>
      <p className="mt-1 text-lg font-semibold text-white">{occupancyPct.toFixed(0)}% (30d)</p>
      <p className="text-xs text-neutral-500">{bookingsThisMonth} bookings this month</p>
    </div>
  );
}
