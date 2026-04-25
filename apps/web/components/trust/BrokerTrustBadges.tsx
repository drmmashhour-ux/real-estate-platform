"use client";

import { useEffect, useRef } from "react";
import { BrokerTrustExplainer } from "@/components/trust/BrokerTrustExplainer";
import { BrokerTrustVerifyLink } from "@/components/trust/BrokerTrustVerifyLink";
import { TRUST_COPY } from "@/lib/trust/broker-trust";

export type BrokerTrustBadgesProps = {
  licensedOaciq: boolean;
  insuredFarcia: boolean;
  independentBroker: boolean;
  locale: string;
  brokerUserId?: string | null;
  listingId?: string | null;
  dealId?: string | null;
  surface: "listing" | "profile" | "deal" | "contract" | "investor_packet" | "other";
  /** Visual theme for listing (dark/gold) vs dashboard (emerald). */
  variant?: "listing" | "dashboard";
};

/**
 * Trust badges driven by platform records only — no OACIQ “verified” implication.
 */
export function BrokerTrustBadges({
  licensedOaciq,
  insuredFarcia,
  independentBroker,
  locale,
  brokerUserId,
  listingId,
  dealId,
  surface,
  variant = "listing",
}: BrokerTrustBadgesProps) {
  const auditedRef = useRef(false);
  const anyBadge = licensedOaciq || insuredFarcia || independentBroker;

  useEffect(() => {
    if (!anyBadge || auditedRef.current) return;
    auditedRef.current = true;
    void fetch("/api/trust/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "trust_badge_displayed",
        brokerUserId: brokerUserId ?? undefined,
        listingId: listingId ?? undefined,
        dealId: dealId ?? undefined,
        surface,
      }),
    }).catch(() => null);
  }, [anyBadge, brokerUserId, listingId, dealId, surface]);

  if (!anyBadge) return null;

  const pillBase =
    variant === "listing"
      ? "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-tight"
      : "inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-tight";

  const licCls =
    variant === "listing"
      ? `${pillBase} border-emerald-500/35 bg-emerald-500/10 text-emerald-100`
      : `${pillBase} border-emerald-600/40 bg-emerald-950/50 text-emerald-100`;

  const insCls =
    variant === "listing"
      ? `${pillBase} border-sky-500/35 bg-sky-500/10 text-sky-100`
      : `${pillBase} border-sky-600/40 bg-sky-950/45 text-sky-100`;

  const indCls =
    variant === "listing"
      ? `${pillBase} border-[#D4AF37]/35 bg-[#D4AF37]/10 text-[#E8D589]`
      : `${pillBase} border-amber-500/35 bg-amber-950/40 text-amber-100`;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {licensedOaciq ? <span className={licCls}>{TRUST_COPY.licensedBadge}</span> : null}
        {insuredFarcia ? <span className={insCls}>{TRUST_COPY.insuredBadge}</span> : null}
        {independentBroker ? <span className={indCls}>{TRUST_COPY.independentBadge}</span> : null}
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <BrokerTrustExplainer
          buttonClassName={variant === "listing" ? "text-[#E8D589]/90 decoration-[#D4AF37]/35" : ""}
        />
        <BrokerTrustVerifyLink
          locale={locale}
          brokerUserId={brokerUserId}
          listingId={listingId}
          dealId={dealId}
          surface={surface}
          className={variant === "listing" ? "text-[#E8D589]/90 decoration-[#D4AF37]/35" : ""}
        />
      </div>
    </div>
  );
}
