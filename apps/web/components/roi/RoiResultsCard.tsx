"use client";

export function RoiResultsCard({
  title,
  subtitle,
  gainLabel,
  gainAmount,
  gainPercent,
}: {
  title: string;
  subtitle?: string;
  gainLabel: string;
  gainAmount: string;
  gainPercent?: string | null;
}) {
  return (
    <div className="rounded-2xl border border-premium-gold/30 bg-gradient-to-br from-black to-zinc-950 p-6 shadow-lg">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">{title}</p>
      {subtitle ? <p className="mt-2 text-sm text-slate-400">{subtitle}</p> : null}
      <p className="mt-4 text-3xl font-bold text-white">{gainAmount}</p>
      <p className="text-sm text-slate-400">{gainLabel}</p>
      {gainPercent ? <p className="mt-2 text-lg text-premium-gold">{gainPercent}</p> : null}
    </div>
  );
}
