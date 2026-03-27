"use client";

import { bnhubPremium } from "./bnhub-premium-ui";

export function BundleCard({
  name,
  description,
  bundleCode,
  priceLabel,
}: {
  name: string;
  description?: string | null;
  bundleCode: string;
  priceLabel?: string;
}) {
  return (
    <div className={`p-4 ${bnhubPremium.panel}`}>
      <p className={bnhubPremium.heading}>{name}</p>
      <p className={`mt-1 font-mono text-xs ${bnhubPremium.accent}`}>{bundleCode}</p>
      {description ? <p className={`mt-2 ${bnhubPremium.subtext}`}>{description}</p> : null}
      {priceLabel ? <p className={`mt-3 text-sm ${bnhubPremium.accent}`}>{priceLabel}</p> : null}
    </div>
  );
}
