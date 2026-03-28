type Props = {
  name: string;
  priceLabel: string;
  description: string;
  highlighted?: boolean;
  onSelect?: () => void;
  ctaLabel?: string;
};

export function PricingCard({
  name,
  priceLabel,
  description,
  highlighted,
  onSelect,
  ctaLabel = "Choose Pro",
}: Props) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        highlighted ? "border-premium-gold/50 bg-premium-gold/10" : "border-white/10 bg-white/[0.03]"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-premium-gold/90">{name}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{priceLabel}</p>
      <p className="mt-1 text-xs text-slate-400">{description}</p>
      {onSelect ? (
        <button
          type="button"
          onClick={onSelect}
          className="mt-4 w-full rounded-lg bg-premium-gold py-2 text-sm font-semibold text-black hover:brightness-110"
        >
          {ctaLabel}
        </button>
      ) : null}
    </div>
  );
}
