/** Human-readable relative time for broker dashboards, e.g. "2h ago". */
export function formatLeadFreshness(iso: string): string {
  const d = new Date(iso);
  const ms = Date.now() - d.getTime();
  if (!Number.isFinite(ms) || ms < 0) return "—";
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

export function newLeadFreshnessLabel(iso: string): string {
  const rel = formatLeadFreshness(iso);
  return rel === "—" ? "New lead" : `New lead · ${rel}`;
}
