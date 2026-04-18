"use client";

export function RevenueCard({ label, cents }: { label: string; cents: number }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <p className="text-xs uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-premium-gold">${(cents / 100).toFixed(0)}</p>
    </div>
  );
}
