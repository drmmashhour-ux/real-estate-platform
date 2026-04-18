"use client";

/**
 * Trust-safe, data-backed badges for listing cards. Never shows fraud suspicion — only verified inputs from the server.
 */
export type ListingBadgesProps = {
  verified?: boolean;
  /** When server computed a strong deal signal (e.g. price vs peer band) */
  greatDeal?: boolean;
  priceDropped?: boolean;
  featuredActive?: boolean;
  newListing?: boolean;
  className?: string;
};

export function ListingBadges({
  verified,
  greatDeal,
  priceDropped,
  featuredActive,
  newListing,
  className = "",
}: ListingBadgesProps) {
  const items: { key: string; label: string; className: string }[] = [];
  if (verified) items.push({ key: "v", label: "Verified", className: "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/30" });
  if (greatDeal) items.push({ key: "d", label: "Great deal", className: "bg-amber-500/15 text-amber-100 ring-1 ring-amber-500/25" });
  if (priceDropped) items.push({ key: "p", label: "Price dropped", className: "bg-sky-500/15 text-sky-100 ring-1 ring-sky-500/25" });
  if (featuredActive) items.push({ key: "f", label: "Featured", className: "bg-yellow-500/15 text-yellow-100 ring-1 ring-yellow-500/30" });
  if (newListing) items.push({ key: "n", label: "New", className: "bg-slate-500/20 text-slate-100 ring-1 ring-white/10" });

  if (items.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {items.map((b) => (
        <span key={b.key} className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${b.className}`}>
          {b.label}
        </span>
      ))}
    </div>
  );
}
