type PricingFeatureListProps = {
  features: string[];
  className?: string;
};

export function PricingFeatureList({ features, className = "" }: PricingFeatureListProps) {
  return (
    <ul className={`space-y-2.5 text-sm text-slate-300 ${className}`}>
      {features.map((f) => (
        <li key={f} className="flex gap-2.5">
          <span
            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-premium-gold"
            aria-hidden
          />
          <span>{f}</span>
        </li>
      ))}
    </ul>
  );
}
