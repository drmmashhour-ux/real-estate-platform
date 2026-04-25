"use client";

import Link from "next/link";
import { BrokerTrustVerifyLink } from "@/components/trust/BrokerTrustVerifyLink";
import { TRUST_COPY } from "@/lib/trust/broker-trust";

type Props = {
  locale: string;
  country: string;
  brokerId: string;
  brokerDisplayName: string;
  licenceNumber: string | null;
  insuranceActiveOnFile: boolean;
};

/**
 * Footer block for contract / drafting surfaces — broker compliance lines only (not platform regulation).
 */
export function BrokerContractComplianceFooter({
  locale,
  country,
  brokerId,
  brokerDisplayName,
  licenceNumber,
  insuranceActiveOnFile,
}: Props) {
  const profileHref = `/${locale}/${country}/broker/${brokerId}`;

  return (
    <footer
      className="mt-8 rounded-xl border border-ds-border bg-black/30 p-4 text-xs leading-relaxed text-ds-text-secondary"
      aria-label="Broker compliance"
    >
      <p className="font-semibold uppercase tracking-wide text-ds-gold/80">Broker compliance</p>
      <ul className="mt-2 list-inside list-disc space-y-1">
        <li>
          <span className="text-ds-text">Broker: </span>
          {brokerDisplayName}
          {" · "}
          <Link href={profileHref} className="text-ds-gold hover:text-amber-200">
            Public profile
          </Link>
        </li>
        <li>
          <span className="text-ds-text">OACIQ licence number (on file): </span>
          {licenceNumber?.trim() ? licenceNumber.trim() : "—"}
        </li>
        <li>
          {insuranceActiveOnFile ? TRUST_COPY.contractInsuranceActive : TRUST_COPY.contractInsuranceNone}
        </li>
      </ul>
      <p className="mt-3 text-[11px] text-ds-text-secondary/90">{TRUST_COPY.platformNotRegulator}</p>
      <p className="mt-2">
        <BrokerTrustVerifyLink
          locale={locale}
          brokerUserId={brokerId}
          dealId={undefined}
          surface="contract"
          className="text-ds-gold decoration-amber-500/40 hover:text-amber-200"
        />
      </p>
    </footer>
  );
}
