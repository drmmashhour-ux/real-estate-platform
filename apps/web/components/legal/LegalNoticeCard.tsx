"use client";

import { useId } from "react";
import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import type { LegalNoticeEntry, LegalNoticeKey } from "@/modules/legal-notices/legalNoticeContent";
import { getLegalNotice } from "@/modules/legal-notices/legalNoticeContent";
import { cn } from "@/lib/utils";

type Locale = "fr" | "en";

const severityStyles = {
  critical: {
    border: "border-red-500/70",
    bg: "bg-red-950/35",
    icon: "text-red-400",
    ring: "ring-red-500/20",
  },
  warning: {
    border: "border-amber-500/70",
    bg: "bg-amber-950/30",
    icon: "text-amber-400",
    ring: "ring-amber-500/20",
  },
  info: {
    border: "border-sky-500/55",
    bg: "bg-sky-950/25",
    icon: "text-sky-400",
    ring: "ring-sky-500/15",
  },
} as const;

function SeverityIcon({ severity }: { severity: LegalNoticeEntry["severity"] }) {
  if (severity === "critical") return <ShieldAlert className="h-5 w-5 shrink-0" aria-hidden />;
  if (severity === "warning") return <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden />;
  return <Info className="h-5 w-5 shrink-0" aria-hidden />;
}

export type LegalNoticeCardProps = {
  noticeKey: LegalNoticeKey;
  /** Primary FR; EN as secondary. */
  locale?: Locale;
  /** Controlled acknowledgment (required notices). */
  acknowledged?: boolean;
  /** Optional acknowledgment (warning — recommended). */
  recommendedAcknowledged?: boolean;
  onAcknowledgedChange?: (value: boolean) => void;
  onRecommendedAcknowledgedChange?: (value: boolean) => void;
  className?: string;
};

/**
 * Renders one library notice with border/icon by severity.
 * - critical + requiresAcknowledgment: required checkbox
 * - warning: optional “recommended” checkbox
 * - info: no checkbox
 */
export function LegalNoticeCard({
  noticeKey,
  locale = "fr",
  acknowledged = false,
  recommendedAcknowledged = false,
  onAcknowledgedChange,
  onRecommendedAcknowledgedChange,
  className,
}: LegalNoticeCardProps) {
  const id = useId();
  const entry = getLegalNotice(noticeKey);
  const title = locale === "fr" ? entry.titleFr : entry.titleEn;
  const content = locale === "fr" ? entry.contentFr : entry.contentEn;
  const st = severityStyles[entry.severity];
  const showRequired = entry.requiresAcknowledgment && entry.severity === "critical";
  const showRecommended =
    !entry.requiresAcknowledgment && entry.severity === "warning" && onRecommendedAcknowledgedChange;

  return (
    <div
      role="region"
      aria-labelledby={`${id}-title`}
      className={cn(
        "rounded-xl border-2 p-4 shadow-sm ring-1",
        st.border,
        st.bg,
        st.ring,
        className,
      )}
    >
      <div className="flex gap-3">
        <span className={cn("mt-0.5", st.icon)}>
          <SeverityIcon severity={entry.severity} />
        </span>
        <div className="min-w-0 flex-1 space-y-2">
          <h3 id={`${id}-title`} className="text-sm font-semibold leading-snug text-white">
            {title}
          </h3>
          <p className="text-sm leading-relaxed text-slate-300">{content}</p>

          {showRequired ? (
            <label className="mt-3 flex cursor-pointer items-start gap-2 text-sm text-slate-200">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-500 bg-slate-900 text-amber-500 focus:ring-amber-500/40"
                checked={acknowledged}
                onChange={(e) => onAcknowledgedChange?.(e.target.checked)}
                aria-required="true"
              />
              <span>
                {locale === "fr"
                  ? "Je confirme avoir lu et compris cet avis."
                  : "I confirm that I have read and understood this notice."}
              </span>
            </label>
          ) : null}

          {showRecommended ? (
            <label className="mt-2 flex cursor-pointer items-start gap-2 text-sm text-slate-400">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-500 bg-slate-900 text-amber-500/50 focus:ring-amber-500/30"
                checked={recommendedAcknowledged}
                onChange={(e) => onRecommendedAcknowledgedChange?.(e.target.checked)}
              />
              <span>
                {locale === "fr"
                  ? "J’ai pris connaissance de cet avis (recommandé)."
                  : "I have reviewed this notice (recommended)."}
              </span>
            </label>
          ) : null}
        </div>
      </div>
    </div>
  );
}
