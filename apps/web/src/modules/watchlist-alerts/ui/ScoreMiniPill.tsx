export function ScoreMiniPill({ label, value }: { label: string; value: number | null | undefined }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/25 px-2 py-1">
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-sm font-semibold text-white">{value ?? "-"}</p>
    </div>
  );
}
