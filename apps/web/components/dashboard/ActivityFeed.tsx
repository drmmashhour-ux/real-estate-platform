import type { ReactNode } from "react";

export type ActivityItem = {
  id: string;
  title: string;
  meta?: string;
  icon?: ReactNode;
};

/**
 * Recent activity list — compact rows for dashboards.
 */
export function ActivityFeed({
  title = "Recent activity",
  items,
  empty,
}: {
  title?: string;
  items: ActivityItem[];
  empty?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-ds-border bg-ds-card p-4 shadow-ds-soft sm:p-6">
      <h3 className="font-[family-name:var(--font-serif)] text-lg font-semibold text-ds-text">{title}</h3>
      {items.length === 0 ?
        <div className="mt-6 text-sm text-ds-text-secondary">
          {empty ?? "Nothing new yet — check back after your next action."}
        </div>
      : <ul className="mt-4 space-y-3">
          {items.map((a) => (
            <li key={a.id} className="flex gap-3 rounded-xl border border-white/5 bg-ds-surface/50 px-3 py-2.5">
              {a.icon ? <div className="shrink-0 text-ds-gold">{a.icon}</div> : null}
              <div className="min-w-0">
                <p className="text-sm font-medium text-ds-text">{a.title}</p>
                {a.meta ? <p className="text-xs text-ds-text-secondary">{a.meta}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      }
    </div>
  );
}
