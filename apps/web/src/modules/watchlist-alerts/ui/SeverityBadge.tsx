export function SeverityBadge({ severity }: { severity: "info" | "warning" | "critical" }) {
  const cls =
    severity === "critical"
      ? "border-rose-400/40 bg-rose-500/20 text-rose-200"
      : severity === "warning"
        ? "border-amber-400/40 bg-amber-500/20 text-amber-100"
        : "border-sky-400/40 bg-sky-500/20 text-sky-100";

  return <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase ${cls}`}>{severity}</span>;
}
