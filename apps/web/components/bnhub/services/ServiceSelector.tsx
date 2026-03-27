"use client";

import { useMemo, useState } from "react";
import { ServiceCard, type GuestOfferCard } from "./ServiceCard";
import { ServiceCategoryTabs } from "./ServiceCategoryTabs";

export type SelectionMap = Record<string, number>;

export function ServiceSelector({
  offers,
  suggestedServiceCodes,
  value,
  onChange,
}: {
  offers: GuestOfferCard[];
  suggestedServiceCodes: string[];
  value: SelectionMap;
  onChange: (next: SelectionMap) => void;
}) {
  const categories = useMemo(() => {
    const s = new Set<string>();
    for (const o of offers) s.add(o.category);
    return [...s].sort();
  }, [offers]);

  const [tab, setTab] = useState("ALL");

  const filtered = useMemo(() => {
    if (tab === "ALL") return offers;
    return offers.filter((o) => o.category === tab);
  }, [offers, tab]);

  function setQty(listingServiceId: string, q: number) {
    const next = { ...value };
    if (q <= 0) delete next[listingServiceId];
    else next[listingServiceId] = q;
    onChange(next);
  }

  if (!offers.length) {
    return (
      <p className="text-sm text-slate-500">
        No optional services are configured for this listing. You can still message the host with special requests.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-200">Available services</h3>
        <p className="mt-1 text-xs text-slate-500">
          Prices are shown before you pay. Nothing is added without your selection.
        </p>
      </div>
      <ServiceCategoryTabs categories={categories} value={tab} onChange={setTab} />
      <ul className="space-y-3">
        {filtered.map((o) => (
          <li key={o.id}>
            <ServiceCard
              offer={o}
              quantity={value[o.id] ?? 0}
              suggested={suggestedServiceCodes.includes(o.serviceCode)}
              onQuantityChange={(q) => setQty(o.id, q)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
