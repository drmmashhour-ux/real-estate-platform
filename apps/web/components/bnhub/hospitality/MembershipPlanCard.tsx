"use client";

import { bnhubPremium } from "./bnhub-premium-ui";

export function MembershipPlanCard({
  name,
  code,
  priceLabel,
  description,
}: {
  name: string;
  code: string;
  priceLabel: string;
  description?: string | null;
}) {
  return (
    <div className={`p-5 ${bnhubPremium.panel}`}>
      <p className={bnhubPremium.heading}>{name}</p>
      <p className={`mt-1 font-mono text-xs ${bnhubPremium.accent}`}>{code}</p>
      <p className="mt-3 text-2xl font-bold text-amber-100">{priceLabel}</p>
      {description ? <p className={`mt-2 text-sm ${bnhubPremium.subtext}`}>{description}</p> : null}
    </div>
  );
}
