export function FileHealthBadge({ health }: { health: "healthy" | "warning" | "blocked" | "critical" }) {
  const cls = health === "critical" ? "bg-rose-500/20 text-rose-200" : health === "blocked" ? "bg-amber-500/20 text-amber-100" : health === "warning" ? "bg-yellow-500/20 text-yellow-100" : "bg-emerald-500/20 text-emerald-200";
  return <span className={`rounded-full px-2 py-1 text-xs font-medium ${cls}`}>{health}</span>;
}
