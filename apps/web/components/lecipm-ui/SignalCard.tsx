"use client";

import type { ReactNode } from "react";

import { Link } from "@/i18n/navigation";

export type LecipmSignalSeverity = "INFO" | "WARNING" | "CRITICAL";

export type LecipmSignalAction = {
  id: string;
  label: string;
  href?: string;
  /** Primary = gold fill; secondary = outline */
  variant?: "primary" | "secondary";
  onClick?: () => void;
};

type SignalCardBaseProps = {
  title: string;
  value: ReactNode;
  /** Freeform secondary metric, e.g. "vs 7d" or "+12% pipeline" */
  delta?: string | null;
  /** Interprets delta for color + arrow */
  deltaDirection?: "up" | "down" | "neutral";
  severity: LecipmSignalSeverity;
  /** Short rationale; can include a trailing source line. */
  explanation: ReactNode;
  actions?: LecipmSignalAction[];
  /** Domain label: TRUST, DEAL, etc. */
  domain?: string;
  compact?: boolean;
  /** When set, the whole card is a link (navigate) */
  href?: string;
  className?: string;
};

const GOLD = "#D4AF37";

function severityClass(sev: LecipmSignalSeverity, interactive: boolean): string {
  switch (sev) {
    case "CRITICAL":
      return "border-red-500/30 shadow-[0_0_0_1px_rgba(239,68,68,0.15)]" + (interactive ? " hover:shadow-red-500/20" : "");
    case "WARNING":
      return "border-[#D4AF37]/30 shadow-[0_0_32px_-12px_rgba(212,175,55,0.35)]" + (interactive ? " hover:shadow-[#D4AF37]/30" : "");
    default:
      return "border-neutral-800" + (interactive ? " hover:border-[#D4AF37]/20 hover:shadow-[#D4AF37]/8" : "");
  }
}

function DeltaRow(props: { delta: string | null | undefined; direction: "up" | "down" | "neutral" }) {
  if (props.delta == null || props.delta === "") return null;
  const color =
    props.direction === "up" ? "text-emerald-400"
    : props.direction === "down" ? "text-red-400"
    : "text-neutral-500";
  const arrow =
    props.direction === "up" ? "↑"
    : props.direction === "down" ? "↓"
    : "·";
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-medium ${color}`} aria-label="Change indicator">
      <span aria-hidden>{arrow}</span>
      {props.delta}
    </span>
  );
}

/**
 * LECIPM design-system signal: Signal → explanation → action.
 */
export function SignalCard(props: SignalCardBaseProps) {
  const {
    title,
    value,
    delta,
    deltaDirection = "neutral",
    severity,
    explanation,
    actions = [],
    domain,
    compact = false,
    href,
    className = "",
  } = props;
  const interactive = Boolean(href);
  const body = (
    <article
      className={[
        "group relative flex flex-col rounded-xl border bg-[#050505] p-5 transition duration-200",
        compact ? "gap-2 p-4" : "gap-3",
        "hover:scale-[1.015]",
        interactive ? "cursor-pointer" : "",
        severityClass(severity, interactive),
        className,
      ].join(" ")}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">{title}</p>
          {domain ?
            <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-[#D4AF37]/80">{domain}</p>
          : null}
        </div>
        <span
          className={[
            "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            severity === "CRITICAL" ? "border-red-500/50 bg-red-950/50 text-red-200"
            : severity === "WARNING" ? "border-[#D4AF37]/50 bg-[#1a1508] text-[#e8d9b0]"
            : "border-neutral-700 bg-neutral-900 text-neutral-400",
          ].join(" ")}
        >
          {severity}
        </span>
      </div>

      <div className="flex flex-wrap items-baseline gap-3">
        <span
          className={[
            "font-serif font-bold tracking-tight text-[#f4efe4]",
            compact ? "text-xl" : "text-2xl",
          ].join(" ")}
        >
          {value}
        </span>
        <DeltaRow delta={delta} direction={deltaDirection} />
      </div>

      <div className={["text-neutral-400", compact ? "text-xs" : "text-sm", "leading-relaxed"].join(" ")}>{explanation}</div>

      {actions.length > 0 ?
        <div className="mt-2 flex flex-wrap gap-2">
          {actions.slice(0, 3).map((a) => {
            const primary = a.variant === "primary" || (actions.length === 1 && a.variant !== "secondary");
            const btn = [
              "inline-flex items-center justify-center rounded-full px-4 py-2 text-[11px] font-semibold uppercase tracking-wide transition",
              primary
                ? "bg-[#D4AF37] text-black hover:brightness-110"
                : "border border-[#2a2a2a] bg-transparent text-neutral-200 hover:border-[#D4AF37]/50",
            ].join(" ");
            if (a.href) {
              return (
                <Link key={a.id} href={a.href} className={btn} onClick={(e) => e.stopPropagation()}>
                  {a.label}
                </Link>
              );
            }
            return (
              <button key={a.id} type="button" className={btn} onClick={a.onClick}>
                {a.label}
              </button>
            );
          })}
        </div>
      : null}
    </article>
  );

  if (href) {
    return (
      <Link href={href} className="block outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50 rounded-xl">
        {body}
      </Link>
    );
  }
  return body;
}

export function SignalCardSkeleton(props: { compact?: boolean }) {
  const c = props.compact ?? false;
  return (
    <div
      className={`animate-pulse rounded-xl border border-[#1a1a1a] bg-[#0a0a0a] ${c ? "p-4" : "p-5"}`}
      aria-hidden
    >
      <div className="h-3 w-24 rounded bg-neutral-800" />
      <div className="mt-4 h-8 w-40 rounded bg-neutral-800" />
      <div className="mt-3 h-3 w-full max-w-sm rounded bg-neutral-800/80" />
      <div className="mt-2 h-3 w-4/5 max-w-sm rounded bg-neutral-800/60" />
      <div className="mt-4 flex gap-2">
        <div className="h-8 w-24 rounded-full bg-neutral-800" />
        <div className="h-8 w-24 rounded-full bg-neutral-800/60" />
      </div>
    </div>
  );
}
