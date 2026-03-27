"use client";

export function ServicePricingRow({
  label,
  detail,
  amountCents,
  currency = "USD",
}: {
  label: string;
  detail?: string;
  amountCents: number;
  currency?: string;
}) {
  const sym = currency === "USD" ? "$" : `${currency} `;
  const amt = (amountCents / 100).toFixed(amountCents % 100 === 0 ? 0 : 2);
  return (
    <div className="flex justify-between gap-3 text-sm text-slate-400">
      <span>
        <span className="text-slate-300">{label}</span>
        {detail ? <span className="ml-1 text-xs text-slate-500">({detail})</span> : null}
      </span>
      <span className="shrink-0 font-medium text-slate-200">
        {sym}
        {amt}
      </span>
    </div>
  );
}
