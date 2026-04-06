"use client";

const GOLD = "#D4AF37";

export function AIOverrideBanner({ message }: { message: string }) {
  return (
    <div
      className="rounded-xl border border-amber-500/35 bg-amber-950/25 px-4 py-3 text-sm text-amber-50"
      style={{ boxShadow: `0 0 0 1px ${GOLD}22 inset` }}
    >
      <p className="font-medium text-amber-100">Override or policy hold</p>
      <p className="mt-1 text-amber-100/80">{message}</p>
    </div>
  );
}
