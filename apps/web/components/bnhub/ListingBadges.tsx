export type ListingBadgeKey = "new_listing" | "early_access" | "founding_host" | "verified";

const LABEL: Record<ListingBadgeKey, string> = {
  new_listing: "New listing",
  early_access: "Early access",
  founding_host: "Founding host",
  verified: "Verified",
};

const STYLES: Record<ListingBadgeKey, string> = {
  new_listing: "border-sky-400/50 bg-sky-500/15 text-sky-100",
  early_access: "border-violet-400/50 bg-violet-500/15 text-violet-100",
  founding_host: "border-amber-400/55 bg-amber-500/15 text-amber-100",
  verified: "border-[#D4AF37]/55 bg-[#D4AF37]/12 text-[#D4AF37]",
};

export function ListingBadges({
  badges,
  className = "",
  dense = false,
}: {
  badges: ListingBadgeKey[];
  className?: string;
  /** Tighter chips for cards */
  dense?: boolean;
}) {
  if (!badges.length) return null;
  const pad = dense ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]";
  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`} aria-label="Listing badges">
      {badges.map((key) => (
        <li
          key={key}
          className={`inline-flex rounded-full border font-semibold uppercase tracking-wide ${pad} ${STYLES[key]}`}
        >
          {LABEL[key]}
        </li>
      ))}
    </ul>
  );
}

/** Derive badge keys from listing + host flags (transparent rules — no fake bookings/reviews). */
export function deriveBnhubListingBadges(input: {
  verified: boolean;
  createdAt: Date | string;
  earlyAccessPercentOff?: number | null;
  foundingHost?: boolean;
  /** When true, show early access for pilot regions even without a numeric discount */
  earlyAccessRegion?: boolean;
}): ListingBadgeKey[] {
  const out: ListingBadgeKey[] = [];
  const created = typeof input.createdAt === "string" ? new Date(input.createdAt) : input.createdAt;
  const ageMs = Date.now() - created.getTime();
  const fourteenDays = 14 * 86_400_000;
  if (ageMs >= 0 && ageMs <= fourteenDays) out.push("new_listing");
  if (
    (input.earlyAccessPercentOff != null && input.earlyAccessPercentOff > 0) ||
    input.earlyAccessRegion
  ) {
    out.push("early_access");
  }
  if (input.foundingHost) out.push("founding_host");
  if (input.verified) out.push("verified");
  return out;
}
