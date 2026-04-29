"use client";

/** Minimal progress indicator (shadcn-style API surface). */
export function Progress({ value, className }: { value: number; className?: string }) {
  const v = Math.min(100, Math.max(0, value));
  return (
    <div className={["h-2 w-full overflow-hidden rounded-full bg-slate-200/20", className ?? ""].join(" ").trim()}>
      <div className="h-full rounded-full bg-blue-600 transition-[width]" style={{ width: `${v}%` }} />
    </div>
  );
}
