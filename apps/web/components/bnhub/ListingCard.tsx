import Link from "next/link";
import { Star } from "lucide-react";
import { TrustBadge } from "@/components/bnhub/TrustBadge";
import type { BnhubFraudHeuristic, BnhubListingRiskLevel } from "@/modules/bnhub/recommendationEngine";

export type BnhubListingCardProps = {
  href: string;
  imageUrl: string | null;
  title: string;
  city?: string | null;
  nightPriceCents: number;
  /** 1–5 average or null when unknown */
  rating: number | null;
  reviewCount?: number;
  verified: boolean;
  /** Homepage: image, price, rating, verified only. Search / rich: full trust row. */
  layout?: "minimal" | "full";
  riskLevel?: BnhubListingRiskLevel;
  valueLabel?: "Best value" | "Great price" | null;
  fraud?: BnhubFraudHeuristic;
  launchBadges?: { newListing?: boolean; specialOffer?: boolean };
};

export function ListingCard({
  href,
  imageUrl,
  title,
  city,
  nightPriceCents,
  rating,
  reviewCount = 0,
  verified,
  layout = "minimal",
  riskLevel = "medium",
  valueLabel,
  fraud,
  launchBadges,
}: BnhubListingCardProps) {
  const price = (nightPriceCents / 100).toFixed(0);
  const full = layout === "full";

  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0A] transition duration-300 hover:border-[#D4AF37]/35 hover:shadow-[0_24px_60px_-20px_rgba(212,175,55,0.18)] active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100"
    >
      <div className="relative aspect-[4/3] bg-neutral-900 sm:aspect-[16/10]">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white/35">Photo soon</div>
        )}
        {verified && !full ? (
          <span className="absolute left-3 top-3 rounded-full border border-[#D4AF37]/55 bg-black/75 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#D4AF37] backdrop-blur-sm">
            Verified
          </span>
        ) : null}
        {full && valueLabel ? (
          <span className="absolute left-3 top-3 rounded-full border border-emerald-400/40 bg-black/75 px-3 py-1 text-[11px] font-semibold text-emerald-200 backdrop-blur-sm">
            {valueLabel}
          </span>
        ) : null}
        {full && (launchBadges?.newListing || launchBadges?.specialOffer) ? (
          <div className="absolute right-3 top-3 flex max-w-[70%] flex-col items-end gap-1.5">
            {launchBadges?.newListing ? (
              <span className="rounded-full bg-sky-500/90 px-2.5 py-1 text-[11px] font-semibold text-black shadow-sm backdrop-blur-sm">
                New on BNHub
              </span>
            ) : null}
            {launchBadges?.specialOffer ? (
              <span className="rounded-full bg-[#D4AF37]/90 px-2.5 py-1 text-[11px] font-semibold text-black shadow-sm backdrop-blur-sm">
                Special offer
              </span>
            ) : null}
          </div>
        ) : null}
        <span className="absolute bottom-3 left-3 rounded-xl bg-black/75 px-3 py-2 text-lg font-semibold tabular-nums text-white backdrop-blur-sm">
          ${price}
          <span className="text-sm font-normal text-white/65"> / night</span>
        </span>
      </div>
      <div className="space-y-3 p-5 sm:p-6">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-white group-hover:text-[#D4AF37] sm:text-lg">
          {title}
        </h3>
        {city ? <p className="text-sm text-white/50">{city}</p> : null}
        {full ? (
          <>
            <TrustBadge
              verified={verified}
              hostRating={rating}
              reviewCount={reviewCount}
              riskLevel={riskLevel}
              className="pt-0.5"
            />
            {fraud?.level === "watch" && fraud.reason ? (
              <p className="text-[11px] leading-snug text-amber-200/90">Trust note: {fraud.reason}</p>
            ) : null}
          </>
        ) : (
          <div className="flex min-h-[44px] items-center gap-2 text-sm text-white/80">
            <Star className="h-4 w-4 shrink-0 fill-[#D4AF37]/90 text-[#D4AF37]" aria-hidden />
            {rating != null ? (
              <span>
                {rating.toFixed(1)}
                {reviewCount > 0 ? <span className="text-white/45"> ({reviewCount})</span> : null}
              </span>
            ) : (
              <span className="text-white/45">New listing</span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
