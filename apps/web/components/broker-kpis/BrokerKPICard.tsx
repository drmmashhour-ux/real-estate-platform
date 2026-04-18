import type { ReactNode } from "react";

export function BrokerKPICard({
  label,
  value,
  hint,
  children,
}: {
  label: string;
  value: string | number;
  hint?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-amber-900/40 bg-gradient-to-br from-black/80 to-zinc-950/90 p-4 shadow-[0_0_0_1px_rgba(212,175,55,0.08)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200/70">{label}</p>
      <p className="mt-2 font-serif text-2xl tabular-nums text-amber-50">{value}</p>
      {hint ? <p className="mt-1 text-[11px] leading-snug text-zinc-500">{hint}</p> : null}
      {children}
    </div>
  );
}
