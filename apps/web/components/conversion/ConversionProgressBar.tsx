export function ConversionProgressBar({
  current,
  total,
  label,
}: {
  current: number;
  total: number;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(100, Math.round((current / Math.max(1, total)) * 100)));
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
        <span>{label ?? `Step ${current} of ${total}`}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 w-full rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-[#C9A646]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
