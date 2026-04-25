"use client";

import { useId, useState } from "react";
import { HelpCircle } from "lucide-react";
import { TRUST_COPY } from "@/lib/trust/broker-trust";

type Props = {
  className?: string;
  buttonClassName?: string;
};

/** Accessible “What does this mean?” disclosure for OACIQ / FARCIQ (educational; no platform-as-regulator claims). */
export function BrokerTrustExplainer({ className = "", buttonClassName = "" }: Props) {
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        className={`inline-flex items-center gap-1 rounded-md text-xs font-medium text-emerald-200/90 underline decoration-emerald-500/40 underline-offset-2 hover:text-emerald-100 ${buttonClassName}`}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
      >
        <HelpCircle className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
        {TRUST_COPY.whatMeansTitle}
      </button>
      {open ? (
        <div
          id={id}
          role="region"
          aria-label={TRUST_COPY.whatMeansTitle}
          className="absolute left-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] rounded-lg border border-white/15 bg-zinc-950/98 p-3 text-left text-[11px] leading-relaxed text-white/85 shadow-xl"
        >
          <p>{TRUST_COPY.whatMeansBody}</p>
          <p className="mt-2 text-white/55">{TRUST_COPY.platformNotRegulator}</p>
        </div>
      ) : null}
    </div>
  );
}
