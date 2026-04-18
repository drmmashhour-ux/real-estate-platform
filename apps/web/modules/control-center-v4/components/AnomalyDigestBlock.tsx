"use client";

import type { CommandCenterAnomalyDigestItem, CommandCenterDigestSeverity } from "../company-command-center-v4.types";

const SEV: Record<CommandCenterDigestSeverity, string> = {
  info: "text-zinc-400",
  watch: "text-amber-200/90",
  warning: "text-orange-200/90",
  critical: "text-rose-200",
};

export function AnomalyDigestBlock({
  items,
  counts,
}: {
  items: CommandCenterAnomalyDigestItem[];
  counts: Record<CommandCenterDigestSeverity, number>;
}) {
  const summary = `info ${counts.info} · watch ${counts.watch} · warning ${counts.warning} · critical ${counts.critical}`;
  if (!items.length) {
    return (
      <div>
        <p className="text-[10px] text-zinc-500">{summary}</p>
        <p className="mt-2 text-xs text-zinc-500">No digest items from current signals.</p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-[10px] text-zinc-500">{summary}</p>
      <ul className="space-y-2">
        {items.slice(0, 16).map((it) => (
          <li key={it.id} className="rounded-lg border border-zinc-800/80 bg-zinc-950/40 px-3 py-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-xs font-medium text-zinc-200">
                [{it.system}] {it.title}
              </span>
              <span className={`text-[10px] uppercase ${SEV[it.severity]}`}>{it.severity}</span>
            </div>
            <p className="mt-1 text-[11px] text-zinc-400">{it.summary}</p>
            {it.metric ? <p className="mt-1 text-[10px] text-zinc-500">Metric: {it.metric}</p> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
