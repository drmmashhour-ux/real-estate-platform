"use client";

type Props = { title: string; value: string; description: string };

export function InvestorInsightCard({ title, value, description }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
    </div>
  );
}
