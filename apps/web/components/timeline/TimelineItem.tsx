"use client";

import type { ReactNode } from "react";
import { formatAuditDateTime, formatAuditUtcIso } from "@/lib/format/audit-datetime";
import { TimelineBadge, type TimelineBadgeVariant } from "./timeline-badge";

export type TimelineItemProps = {
  title: string;
  at: Date | string;
  /** Primary line uses local browser time; set `auditMode` for 24h + raw UTC line. */
  auditMode?: boolean;
  badge?: TimelineBadgeVariant;
  badgeLabel?: string;
  /** Extra line under title (entity id, user id, …). */
  meta?: ReactNode;
  /** Shown under the timestamp (JSON, children, …). */
  detail?: ReactNode;
  /** Secondary line: relative time (e.g. “2 hours ago”). */
  showRelative?: boolean;
};

/**
 * Single point on an audit timeline — full date/time in local TZ by default.
 */
export function TimelineItem({
  title,
  at,
  auditMode = false,
  badge,
  badgeLabel,
  meta,
  detail,
  showRelative = true,
}: TimelineItemProps) {
  const primary = formatAuditDateTime(at, {
    hour12: !auditMode,
    showTimezone: true,
    relative: showRelative && !auditMode,
  });
  const utcLine = auditMode ? formatAuditUtcIso(at) : null;

  return (
    <li className="relative border-l border-slate-700 pl-5 pb-6 last:pb-0">
      <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-[#C9A646] ring-2 ring-slate-950" />
      <div className="flex flex-wrap items-center gap-2">
        {badge ? <TimelineBadge variant={badge}>{badgeLabel ?? badge}</TimelineBadge> : null}
        <span className="text-sm font-medium text-slate-100">{title}</span>
      </div>
      {meta ? <div className="mt-0.5 text-xs text-slate-500">{meta}</div> : null}
      <p className="mt-1 font-mono text-xs text-slate-400">{primary}</p>
      {utcLine ? <p className="mt-0.5 font-mono text-[10px] text-slate-600">UTC: {utcLine}</p> : null}
      {detail ? <div className="mt-2 text-xs text-slate-400">{detail}</div> : null}
    </li>
  );
}
