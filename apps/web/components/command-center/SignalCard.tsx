"use client";

import { Link } from "@/i18n/navigation";

import type { Signal } from "@/modules/command-center/signal.types";

import { cc } from "@/components/command-center/cc-tokens";

function formatSignalSource(source: Signal["source"]): string {
  const base = source.engine.replace(/_/g, " ");
  if (source.engine === "deal_intelligence" && "dealId" in source && source.dealId) {
    return `${base} · ${source.dealId.slice(0, 8)}…`;
  }
  return base;
}

function severityStyles(sev: Signal["severity"]): { ring: string; pill: string; label: string } {
  switch (sev) {
    case "CRITICAL":
      return {
        ring: "border-red-500/35 shadow-[0_0_0_1px_rgba(239,68,68,0.12)]",
        pill: "bg-red-950/50 text-red-200/90 border-red-800/50",
        label: "Critical",
      };
    case "WARNING":
      return {
        ring: "border-[#D4AF37]/30 shadow-[0_0_20px_-8px_rgba(212,175,55,0.35)]",
        pill: "bg-[#1a1508] text-[#e6d5a8] border-[#D4AF37]/35",
        label: "Attention",
      };
    default:
      return {
        ring: "border-neutral-800",
        pill: "bg-neutral-900/80 text-neutral-400 border-neutral-700/80",
        label: "Monitor",
      };
  }
}

export function SignalCard(props: { signal: Signal; compact?: boolean }) {
  const { signal } = props;
  const st = severityStyles(signal.severity);
  const compact = props.compact ?? false;

  return (
    <article
      className={`${cc.cardMuted} ${st.ring} flex flex-col ${compact ? "gap-2 p-4" : "gap-3 p-5"}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${st.pill}`}>
            {st.label}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">{signal.domain}</span>
        </div>
        <time className="text-[10px] text-neutral-600" dateTime={signal.timestamp}>
          {new Date(signal.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </time>
      </div>

      <h3 className={`font-semibold leading-snug text-[#f4efe4] ${compact ? "text-sm" : "text-base"}`}>
        {signal.title}
      </h3>

      <div className="flex flex-wrap items-baseline gap-2">
        <span className={`${cc.metric} ${compact ? "text-xl" : "text-2xl"} text-[#f4efe4]`}>{signal.value}</span>
        {signal.delta ?
          <span className="text-xs text-neutral-500">{signal.delta}</span>
        : null}
      </div>

      <p className={`text-neutral-400 ${compact ? "text-xs leading-relaxed" : "text-sm leading-relaxed"}`}>
        {signal.explanation}
      </p>

      <p className="text-[10px] text-neutral-600">
        Source: <span className="text-neutral-500">{formatSignalSource(signal.source)}</span>
      </p>

      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        {signal.recommendedActions.map((a) => (
          <div key={a.id} className="flex flex-col gap-0.5">
            {a.href ?
              <Link
                href={a.href}
                className="inline-flex items-center justify-center rounded-full border border-[#2a2a2a] bg-[#141414] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-200 transition hover:border-[#D4AF37]/45 hover:text-[#f4efe4]"
              >
                {a.label}
              </Link>
            : null}
            {a.requiresApproval ?
              <span className="text-[10px] text-neutral-600">
                Requires documented approval
                {a.postHref ?
                  <>
                    {" "}
                    —{" "}
                    <span className="text-neutral-500" title={a.postHref}>
                      governed API
                    </span>
                  </>
                : null}
              </span>
            : null}
          </div>
        ))}
      </div>
    </article>
  );
}
