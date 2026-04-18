"use client";

export function StickyBookingCard({
  nightPriceCents,
  onBook,
}: {
  nightPriceCents: number;
  onBook?: () => void;
}) {
  return (
    <div className="sticky top-24 rounded-2xl border border-white/15 bg-black/80 p-4 shadow-xl backdrop-blur">
      <p className="text-2xl font-semibold text-white">${(nightPriceCents / 100).toFixed(0)}</p>
      <p className="text-xs text-neutral-500">per night · taxes & fees at checkout (Stripe)</p>
      <button
        type="button"
        onClick={onBook}
        className="lecipm-touch mt-3 w-full rounded-xl bg-premium-gold py-3 text-sm font-semibold text-black"
      >
        Reserve
      </button>
    </div>
  );
}
