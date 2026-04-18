"use client";

export type SubscriptionCardProps = {
  planLabel: string;
  statusLabel: string;
  renewsAtLabel?: string | null;
  className?: string;
};

export function SubscriptionCard({ planLabel, statusLabel, renewsAtLabel, className = "" }: SubscriptionCardProps) {
  return (
    <section className={`rounded-2xl border border-white/10 bg-white/[0.03] p-4 ${className}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Workspace plan</p>
      <p className="mt-1 text-lg font-semibold text-white">{planLabel}</p>
      <p className="mt-1 text-xs text-slate-400">{statusLabel}</p>
      {renewsAtLabel ? <p className="mt-2 text-xs text-slate-500">Renews {renewsAtLabel}</p> : null}
    </section>
  );
}
