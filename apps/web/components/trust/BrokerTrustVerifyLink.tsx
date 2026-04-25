"use client";

import { ExternalLink } from "lucide-react";
import { oaciqRegisterUrl, TRUST_COPY } from "@/lib/trust/broker-trust";

type Props = {
  locale: string;
  brokerUserId?: string | null;
  listingId?: string | null;
  dealId?: string | null;
  surface: "listing" | "profile" | "deal" | "contract" | "investor_packet" | "other";
  className?: string;
};

export function BrokerTrustVerifyLink({
  locale,
  brokerUserId,
  listingId,
  dealId,
  surface,
  className = "",
}: Props) {
  const href = oaciqRegisterUrl(locale);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-xs font-medium text-emerald-200/95 underline decoration-emerald-500/45 underline-offset-2 hover:text-emerald-100 ${className}`}
      onClick={() => {
        void fetch("/api/trust/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "trust_oaciq_verify_click",
            brokerUserId: brokerUserId ?? undefined,
            listingId: listingId ?? undefined,
            dealId: dealId ?? undefined,
            surface,
          }),
        }).catch(() => null);
      }}
    >
      {TRUST_COPY.verifyBroker}
      <ExternalLink className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
    </a>
  );
}
