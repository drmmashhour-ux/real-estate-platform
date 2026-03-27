type Props = { level: string | null };

export function TrustBadge({ level }: Props) {
  if (!level) return <span className="rounded-md bg-slate-800 px-2 py-0.5 text-xs text-slate-400">—</span>;
  const tone =
    level === "verified"
      ? "bg-emerald-500/20 text-emerald-200 border-emerald-500/30"
      : level === "high"
        ? "bg-sky-500/20 text-sky-200 border-sky-500/30"
        : level === "medium"
          ? "bg-amber-500/15 text-amber-100 border-amber-500/25"
          : "bg-rose-500/15 text-rose-100 border-rose-500/25";
  return (
    <span className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${tone}`}>{level}</span>
  );
}
