type Props = {
  label: string;
  value: string;
  sublabel?: string;
};

/** Premium black + gold KPI tile — data passed in from server loaders or parents. */
export function KpiStatCard({ label, value, sublabel }: Props) {
  return (
    <div className="rounded-2xl border border-[#C9A646]/20 bg-[#121212] p-5 shadow-[0_0_40px_rgba(0,0,0,0.45)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C9A646]/90">{label}</p>
      <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-white">{value}</p>
      {sublabel ? <p className="mt-2 text-xs text-slate-500">{sublabel}</p> : null}
    </div>
  );
}
