"use client";

import { useTranslations } from "next-intl";
import { MapDisplay } from "@/components/map/MapDisplay";

type Props = {
  latitude: number;
  longitude: number;
  listingId: string;
};

export function ListingApproximateMap({ latitude, longitude, listingId }: Props) {
  const t = useTranslations("Listing");

  return (
    <section className="rounded-[var(--darlink-radius-2xl)] border border-[color:var(--darlink-border)] bg-[color:var(--darlink-surface)] p-4 shadow-[var(--darlink-shadow-sm)]">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[color:var(--darlink-text-muted)]">{t("approximateLocationMapTitle")}</h2>
      <p className="mt-1 text-xs leading-relaxed text-[color:var(--darlink-text-muted)]">{t("approximateLocationMapHint")}</p>
      <div className="mt-3">
        <MapDisplay latitude={latitude} longitude={longitude} fuzzSeed={listingId} height={240} zoom={12} />
      </div>
    </section>
  );
}
