"use client";

import Link from "next/link";

import { urgencyFromSeverity } from "@/design-system/soins-hub";
import { StatusBadge } from "@/components/soins/StatusBadge";

export type SoinsAlertCardProps = {
  id: string;
  title: string;
  message: string;
  severity: string;
  createdAt: Date | string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
};

export function AlertCard(props: SoinsAlertCardProps) {
  const level = urgencyFromSeverity(props.severity);
  const t =
    typeof props.createdAt === "string" ? new Date(props.createdAt) : props.createdAt;

  return (
    <article
      className={`rounded-2xl border bg-[#0D0D0D] p-4 shadow-inner shadow-black/50 ${
        level === "emergency"
          ? "border-red-500/35"
          : level === "attention"
            ? "border-amber-400/35"
            : "border-emerald-500/25"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge level={level} />
            <span className="text-xs uppercase tracking-wider text-white/40">{props.title}</span>
          </div>
          <p className="text-[17px] leading-relaxed text-white/90">{props.message}</p>
          <p className="text-sm text-white/45">
            {t.toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        </div>
        {(props.actionHref || props.onAction) && props.actionLabel ? (
          props.actionHref ? (
            <Link
              href={props.actionHref}
              className="shrink-0 rounded-xl bg-[#D4AF37] px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-[#E5C158]"
            >
              {props.actionLabel}
            </Link>
          ) : (
            <button
              type="button"
              onClick={props.onAction}
              className="shrink-0 rounded-xl bg-[#D4AF37] px-4 py-2.5 text-sm font-semibold text-black"
            >
              {props.actionLabel}
            </button>
          )
        ) : null}
      </div>
    </article>
  );
}
