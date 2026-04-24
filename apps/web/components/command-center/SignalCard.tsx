"use client";

import { SignalCard as LecipmUiSignalCard } from "@/components/lecipm-ui/SignalCard";

import type { Signal } from "@/modules/command-center/signal.types";

function formatSignalSource(source: Signal["source"]): string {
  const base = source.engine.replace(/_/g, " ");
  if (source.engine === "deal_intelligence" && "dealId" in source && source.dealId) {
    return `${base} · ${source.dealId.slice(0, 8)}…`;
  }
  return base;
}

export function SignalCard(props: { signal: Signal; compact?: boolean }) {
  const { signal, compact } = props;

  const explanation = (
    <>
      {signal.explanation}
      <span className="mt-2 block text-[10px] text-neutral-600">Source: {formatSignalSource(signal.source)}</span>
    </>
  );

  return (
    <LecipmUiSignalCard
      title={signal.title}
      value={signal.value}
      delta={signal.delta}
      deltaDirection="neutral"
      severity={signal.severity}
      explanation={explanation}
      domain={signal.domain}
      compact={compact}
      actions={signal.recommendedActions
        .filter((a) => a.href)
        .map((a, i) => ({
          id: a.id,
          label: a.label,
          href: a.href!,
          variant: i === 0 ? ("primary" as const) : ("secondary" as const),
        }))}
    />
  );
}
