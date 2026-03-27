"use client";

const OPTIONS: { value: string; label: string }[] = [
  { value: "buy_to_live", label: "Buy to live" },
  { value: "buy_to_rent", label: "Buy to rent" },
  { value: "buy_to_flip", label: "Buy to flip" },
  { value: "buy_for_bnhub", label: "Buy for BNHub" },
  { value: "hold_long_term", label: "Hold long term" },
];

type Props = {
  enabled: boolean;
  value: string;
  onChange: (mode: string) => void;
};

export function StrategyModeSelector({ enabled, value, onChange }: Props) {
  if (!enabled) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-[#121212] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C9A646]">Strategy mode</p>
      <p className="mt-1 text-xs text-slate-500">
        Adjusts how the offer assistant weighs cash flow, price position, trust, and risk (rules-based, not a product
        recommendation).
      </p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-3 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
