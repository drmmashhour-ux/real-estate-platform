export function UrgencyBadge({
  label,
  level,
}: {
  label: string;
  level: "high" | "medium" | "early";
}) {
  const cls =
    level === "high"
      ? "border-rose-500/50 bg-rose-500/15 text-rose-200"
      : level === "medium"
        ? "border-amber-500/50 bg-amber-500/15 text-amber-100"
        : "border-slate-600 bg-slate-800 text-slate-300";
  return <span className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${cls}`}>{label}</span>;
}
