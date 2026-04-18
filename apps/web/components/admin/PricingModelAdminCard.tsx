"use client";

export function PricingModelAdminCard({
  planKey,
  bookingFee,
  note,
}: {
  planKey: string;
  bookingFee: string;
  note: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-950 p-3">
      <p className="text-sm font-semibold text-amber-200">{planKey}</p>
      <p className="text-xs text-zinc-400">{bookingFee}</p>
      <p className="mt-2 text-xs text-zinc-500">{note}</p>
    </div>
  );
}
