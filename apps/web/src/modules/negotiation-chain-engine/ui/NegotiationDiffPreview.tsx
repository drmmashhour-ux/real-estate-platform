"use client";

import type { VersionDiffResult } from "@/src/modules/negotiation-chain-engine/domain/negotiationChain.types";
import { formatNegotiationDiffSummary } from "@/src/modules/negotiation-chain-engine/application/negotiationDiffFormat";

type Props = {
  lines?: string[];
  diff?: VersionDiffResult | null;
  /** Collapsible details on small screens */
  collapsible?: boolean;
  title?: string;
};

export function NegotiationDiffPreview({ lines: linesProp, diff, collapsible, title = "Changes vs prior version" }: Props) {
  const lines = diff ? formatNegotiationDiffSummary(diff) : (linesProp ?? []);

  const body =
    lines.length === 0 ? (
      <p className="text-xs text-slate-500">No material changes vs prior version (or first version).</p>
    ) : (
      <ul className="space-y-1.5 text-xs text-slate-200">
        {lines.map((line, i) => (
          <li key={`${i}-${line.slice(0, 24)}`} className="flex gap-2">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-premium-gold/80" aria-hidden />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    );

  if (collapsible) {
    return (
      <details className="group rounded-xl border border-white/10 bg-black/25">
        <summary className="cursor-pointer list-none px-3 py-2 text-xs font-semibold text-slate-300">
          <span className="flex items-center justify-between gap-2">
            {title}
            <span className="text-[10px] font-normal text-slate-500 group-open:hidden">Show</span>
            <span className="hidden text-[10px] font-normal text-slate-500 group-open:inline">Hide</span>
          </span>
        </summary>
        <div className="border-t border-white/5 px-3 pb-3 pt-2">{body}</div>
      </details>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-3">
      <p className="text-xs font-semibold text-slate-400">{title}</p>
      <div className="mt-2">{body}</div>
    </div>
  );
}
