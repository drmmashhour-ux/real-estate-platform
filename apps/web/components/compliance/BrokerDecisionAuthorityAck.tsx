"use client";

import { useId } from "react";
import { OACIQ_BROKER_DECISION_CONFIRMATION_TEXT } from "@/lib/compliance/oaciq/broker-decision-constants";
import { LECIPM_AI_ALLOWED_ROLES_SUMMARY } from "@/lib/compliance/oaciq/broker-ai-binding-policy";

type Props = {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  className?: string;
};

/**
 * Phase 4 — broker must confirm binding actions when `LECIPM_BROKER_DECISION_AUTHORITY_ENFORCEMENT=1`.
 * Pair with API fields `confirmBrokerDecision: true` or exact `brokerDecisionConfirmation` text.
 */
export function BrokerDecisionAuthorityAck({ checked, onChange, disabled, className = "" }: Props) {
  const id = useId();
  return (
    <div
      className={[
        "rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-sm text-slate-200",
        className,
      ].join(" ")}
    >
      <p className="text-xs text-amber-100/90">{LECIPM_AI_ALLOWED_ROLES_SUMMARY}</p>
      <label htmlFor={id} className="mt-3 flex cursor-pointer items-start gap-2">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-white/20 bg-black"
        />
        <span>{OACIQ_BROKER_DECISION_CONFIRMATION_TEXT}</span>
      </label>
    </div>
  );
}
