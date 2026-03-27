type Props = { severity: string | null };

export function SeverityBadge({ severity }: Props) {
  if (!severity) return <span className="text-xs text-slate-500">—</span>;
  const tone =
    severity === "critical"
      ? "bg-red-950/50 text-red-200 border-red-500/40"
      : severity === "high"
        ? "bg-orange-950/40 text-orange-100 border-orange-500/35"
        : severity === "medium"
          ? "bg-amber-950/30 text-amber-100 border-amber-500/25"
          : "bg-slate-800 text-slate-300 border-slate-600";
  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${tone}`}>{severity}</span>
  );
}
