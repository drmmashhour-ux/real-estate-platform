"use client";

import type { ReactNode } from "react";
import { TimelineItem, type TimelineItemProps } from "./TimelineItem";

export type EventTimelineProps = {
  title?: ReactNode;
  emptyLabel?: string;
  items: TimelineItemProps[];
  className?: string;
};

/**
 * Ordered vertical timeline for hubs + admin — uses {@link TimelineItem} for each row.
 */
export function EventTimeline({
  title,
  emptyLabel = "No events yet.",
  items,
  className = "",
}: EventTimelineProps) {
  return (
    <section className={className}>
      {title ? <h3 className="mb-3 text-sm font-semibold text-slate-200">{title}</h3> : null}
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">{emptyLabel}</p>
      ) : (
        <ol className="space-y-0">
          {items.map((item, i) => (
            <TimelineItem key={i} {...item} />
          ))}
        </ol>
      )}
    </section>
  );
}
