"use client";

import { useEffect, useState } from "react";
import { ListingCardV2 } from "./ListingCardV2";

export function GuestPersonalizationFeed({ basePath }: { basePath: string }) {
  const [items, setItems] = useState<
    { id: string; title: string; city: string; nightPriceCents: number; photos: string[] }[]
  >([]);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/bnhub/listings?sort=recommended", { credentials: "include" }).catch(() => null);
      if (!res?.ok) return;
      const data = (await res.json()) as unknown;
      const list = Array.isArray(data) ? data : [];
      setItems(
        list.slice(0, 6).map((l: any) => ({
          id: l.id,
          title: l.title,
          city: l.city,
          nightPriceCents: l.nightPriceCents ?? 0,
          photos: Array.isArray(l.photos) ? l.photos : [],
        })),
      );
    })();
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      <h3 className="text-lg font-semibold text-white">Picked for you</h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((l) => (
          <ListingCardV2
            key={l.id}
            id={l.id}
            href={`${basePath}/bnhub/stays/${encodeURIComponent(l.id)}`}
            title={l.title}
            city={l.city}
            nightPriceCents={l.nightPriceCents}
            photoUrl={l.photos[0] ?? null}
          />
        ))}
      </div>
    </section>
  );
}
