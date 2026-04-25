/**
 * Real-only social proof: counts come from `search_events` (views) and `bnhub_guest_favorites` (saves).
 */
export function ListingActivitySignals({
  viewsToday,
  savesThisWeek,
  className = "",
}: {
  viewsToday: number;
  savesThisWeek: number;
  className?: string;
}) {
  const lines: string[] = [];
  if (viewsToday > 0) {
    lines.push(`Viewed ${viewsToday} time${viewsToday === 1 ? "" : "s"} today`);
  }
  if (savesThisWeek > 0) {
    lines.push(`Saved by ${savesThisWeek} user${savesThisWeek === 1 ? "" : "s"} this week`);
  }
  if (!lines.length) return null;
  return (
    <p className={`text-xs text-white/55 sm:text-sm ${className}`}>
      {lines.join(" · ")}
    </p>
  );
}
