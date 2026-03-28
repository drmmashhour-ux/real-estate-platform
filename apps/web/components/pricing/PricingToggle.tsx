"use client";

type PricingToggleProps = {
  value: "monthly" | "yearly";
  onChange: (v: "monthly" | "yearly") => void;
  yearlyDiscountLabel?: string;
  className?: string;
};

export function PricingToggle({
  value,
  onChange,
  yearlyDiscountLabel = "Save 15%",
  className = "",
}: PricingToggleProps) {
  return (
    <div className={`inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/40 p-1 ${className}`}>
      <button
        type="button"
        onClick={() => onChange("monthly")}
        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
          value === "monthly"
            ? "bg-premium-gold text-black shadow-lg shadow-premium-gold/20"
            : "text-slate-400 hover:text-white"
        }`}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange("yearly")}
        className={`rounded-full px-4 py-2 text-sm font-medium transition ${
          value === "yearly"
            ? "bg-premium-gold text-black shadow-lg shadow-premium-gold/20"
            : "text-slate-400 hover:text-white"
        }`}
      >
        Yearly
        <span className="ml-1.5 text-xs font-semibold text-emerald-400/90">{yearlyDiscountLabel}</span>
      </button>
    </div>
  );
}
