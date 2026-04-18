"use client";

import Link from "next/link";
import type { ControlCenterUnifiedStatus } from "../ai-control-center.types";

const S: Record<ControlCenterUnifiedStatus, { label: string; className: string }> = {
  healthy: { label: "Healthy", className: "border-emerald-800/60 text-emerald-200" },
  limited: { label: "Limited", className: "border-amber-800/60 text-amber-200" },
  warning: { label: "Warning", className: "border-orange-800/60 text-orange-200" },
  critical: { label: "Critical", className: "border-rose-800/60 text-rose-200" },
  disabled: { label: "Disabled", className: "border-zinc-700 text-zinc-500" },
  unavailable: { label: "Unavailable", className: "border-zinc-700 text-zinc-500" },
};

export function AiSystemStatusCard({
  title,
  status,
  summary,
  metrics,
  warningsCount,
  topLine,
  href,
}: {
  title: string;
  status: ControlCenterUnifiedStatus;
  summary: string;
  metrics: { label: string; value: string }[];
  warningsCount?: number | null;
  topLine?: string | null;
  href?: string | null;
}) {
  const b = S[status];
  return (
    <article className="flex flex-col rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
        <span className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-medium ${b.className}`}>{b.label}</span>
      </div>
      <p className="mt-2 line-clamp-3 text-xs text-zinc-400">{summary}</p>
      {topLine ? <p className="mt-2 text-[11px] text-zinc-500">{topLine}</p> : null}
      <dl className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        {metrics.map((m) => (
          <div key={m.label} className="flex justify-between gap-2 rounded border border-zinc-800/60 bg-zinc-900/30 px-2 py-1">
            <dt className="text-zinc-500">{m.label}</dt>
            <dd className="font-mono text-zinc-200">{m.value}</dd>
          </div>
        ))}
      </dl>
      {warningsCount != null ? (
        <p className="mt-2 text-[11px] text-zinc-500">Warnings (hint): {warningsCount}</p>
      ) : null}
      {href ? (
        <Link href={href} className="mt-3 text-xs text-amber-400/90 hover:text-amber-300">
          View details →
        </Link>
      ) : null}
    </article>
  );
}
