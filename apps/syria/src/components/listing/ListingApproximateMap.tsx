"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

/** ORDER SYBNB-86 — defer Google Maps client bundle until after hydration. */
const MapDisplay = dynamic(() => import("@/components/map/MapDisplay").then((m) => m.MapDisplay), {
  ssr: false,
  loading: () => (
    <div className="min-h-[240px] rounded-lg bg-[color:var(--darlink-surface-muted)]" aria-busy />
  ),
});

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
