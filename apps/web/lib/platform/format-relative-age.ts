/** Compact relative time for internal admin surfaces. */
export function formatRelativeAge(iso: string, now = Date.now()): string {
  const t = new Date(iso).getTime();
  const diff = Math.max(0, now - t);
  const mins = Math.floor(diff / 60000);
  if (mins < 90) return `${mins}m ago`;
  const hours = Math.floor(diff / 3600000);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(diff / 86400000);
  return `${days}d ago`;
}
