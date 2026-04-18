"use client";

import { ListingCardV2 } from "./ListingCardV2";

export function SimilarListings({
  basePath,
  items,
}: {
  basePath: string;
  items: {
    id: string;
    title: string;
    city: string;
    nightPriceCents: number;
    photoUrl: string | null;
  }[];
}) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-3">
      <h3 className="text-lg font-semibold text-white">Similar stays</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((l) => (
          <ListingCardV2
            key={l.id}
            id={l.id}
            href={`${basePath}/bnhub/stays/${encodeURIComponent(l.id)}`}
            title={l.title}
            city={l.city}
            nightPriceCents={l.nightPriceCents}
            photoUrl={l.photoUrl}
          />
        ))}
      </div>
    </section>
  );
}
