"use client";

import type { BrokerLicenceEvaluation } from "@/lib/compliance/oaciq/broker-licence-service";
import { OACIQ_LICENCE_BROKER_DECLARATION } from "@/modules/compliance/oaciq/licence-declarations";

/**
 * Compact gate indicator for listing / offer / investor flows — server should still enforce `requireActiveResidentialBrokerLicence`.
 */
export function LicenceValidationBadge(props: {
  evaluation: BrokerLicenceEvaluation | null;
  locale?: "en" | "fr";
  className?: string;
}) {
  if (!props.evaluation) return null;

  const { evaluation: ev } = props;
  const tone =
    ev.uiStatus === "verified"
      ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-100"
      : ev.uiStatus === "warning"
        ? "border-amber-500/50 bg-amber-500/10 text-amber-100"
        : "border-red-500/50 bg-red-500/10 text-red-100";

  const mark = ev.uiStatus === "verified" ? "✅" : ev.uiStatus === "warning" ? "⚠️" : "❌";
  const clause = props.locale === "fr" ? OACIQ_LICENCE_BROKER_DECLARATION.fr : OACIQ_LICENCE_BROKER_DECLARATION.en;

  return (
    <div
      className={`rounded-lg border px-3 py-2 text-xs leading-snug ${tone} ${props.className ?? ""}`}
      role="status"
      aria-live="polite"
    >
      <p className="font-semibold">
        {mark} OACIQ — {ev.label}
      </p>
      <p className="mt-1 opacity-90">{clause}</p>
      {ev.riskLevel ? (
        <p className="mt-1 font-mono text-[10px] uppercase tracking-wide opacity-80">Risk: {ev.riskLevel}</p>
      ) : null}
    </div>
  );
}
