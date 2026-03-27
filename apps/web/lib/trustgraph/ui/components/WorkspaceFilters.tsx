/** Presentational filter bar — wire to URL/searchParams in a route handler when needed. */
export function WorkspaceFilters() {
  return (
    <div className="mb-4 flex flex-wrap gap-2 text-sm text-neutral-600 dark:text-neutral-400">
      <span>Filters: trust level, readiness, date range (API-supported)</span>
    </div>
  );
}
