type Props = {
  marketCondition: string;
  className?: string;
};

const LABELS: Record<string, string> = {
  buyer_favorable: "Buyer-favorable",
  balanced: "Balanced",
  seller_favorable: "Seller-favorable",
  uncertain: "Uncertain",
};

export function MarketConditionBadge({ marketCondition, className = "" }: Props) {
  const label = LABELS[marketCondition] ?? marketCondition.replace(/_/g, " ");
  const tone =
    marketCondition === "seller_favorable"
      ? "border-amber-500/40 bg-amber-500/10 text-amber-200/95"
      : marketCondition === "buyer_favorable"
        ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200/90"
        : marketCondition === "uncertain"
          ? "border-slate-500/40 bg-slate-500/10 text-slate-300"
          : "border-[#C9A646]/35 bg-[#C9A646]/10 text-[#E8C547]/95";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${tone} ${className}`}
    >
      {label}
    </span>
  );
}
