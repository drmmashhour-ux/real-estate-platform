"use client";

export function TrustBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-emerald-800/80 bg-emerald-950/50 px-2.5 py-0.5 text-xs font-medium text-emerald-100">
      {label}
    </span>
  );
}
