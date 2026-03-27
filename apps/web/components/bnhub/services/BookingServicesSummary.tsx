"use client";

import { ServicePricingRow } from "./ServicePricingRow";

export type AddonLine = {
  name: string;
  quantity: number;
  unitPriceCents: number;
  totalPriceCents: number;
  requiresApproval?: boolean;
  isIncluded?: boolean;
};

export function BookingServicesSummary({
  lines,
  addonsSubtotalCents,
  currency = "USD",
}: {
  lines: AddonLine[];
  addonsSubtotalCents: number;
  currency?: string;
}) {
  if (!lines.length) return null;
  return (
    <div className="mt-3 space-y-2 border-t border-slate-700 pt-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Add-ons</p>
      {lines.map((line, i) => (
        <ServicePricingRow
          key={`${line.name}-${i}`}
          label={`${line.name} × ${line.quantity}`}
          detail={
            line.isIncluded
              ? "included"
              : line.requiresApproval
                ? "pending host OK"
                : undefined
          }
          amountCents={line.totalPriceCents}
          currency={currency}
        />
      ))}
      <ServicePricingRow label="Add-ons subtotal" amountCents={addonsSubtotalCents} currency={currency} />
    </div>
  );
}
