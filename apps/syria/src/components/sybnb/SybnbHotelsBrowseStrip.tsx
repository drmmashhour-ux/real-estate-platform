"use client";

import { useTranslations } from "next-intl";
import { ListingCard } from "@/components/ListingCard";
import type { SerializedBrowseListing } from "@/services/search/search.service";

/** SYBNB-42 — Horizontal strip of verified hotel listings above the main SYBNB grid. */
export function SybnbHotelsBrowseStrip(props: { items: SerializedBrowseListing[]; locale: string }) {
  const { items, locale } = props;
  const t = useTranslations("Sybnb.home");
  if (items.length === 0) return null;

  return (
    <section className="space-y-3" aria-labelledby="sybnb-hotels-strip-heading">
      <h2 id="sybnb-hotels-strip-heading" className="text-sm font-semibold text-[color:var(--darlink-text)] [dir=rtl]:text-right">
        {t("hotelsBrowseStripTitle")}
      </h2>
      <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-2 [scrollbar-width:thin] md:flex-wrap md:overflow-visible">
        {items.map((l) => (
          <div key={l.id} className="w-[min(300px,88vw)] shrink-0 md:w-[min(300px,calc(33.333%-1rem))]">
            <ListingCard listing={l} locale={locale} />
          </div>
        ))}
      </div>
    </section>
  );
}
