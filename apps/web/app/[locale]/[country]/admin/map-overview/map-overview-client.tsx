"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MapSearch } from "@/components/search/MapSearch";
import type { MapListing } from "@/components/map/MapListing";

type Pin = {
  id: string;
  kind: "bnhub" | "fsbo";
  title: string;
  latitude: number;
  longitude: number;
  price: number;
  href: string;
  image?: string | null;
};

function toMapListing(p: Pin): MapListing {
  return {
    id: `${p.kind}-${p.id}`,
    latitude: p.latitude,
    longitude: p.longitude,
    price: p.price,
    title: p.title,
    image: p.image ?? undefined,
    href: p.href,
    platformListing: true,
    listingHeadline: p.kind === "bnhub" ? "Nightly stay" : undefined,
  };
}

export function MapOverviewClient({
  bnhubPins,
  fsboPins,
}: {
  bnhubPins: Pin[];
  fsboPins: Pin[];
}) {
  const [layer, setLayer] = useState<"all" | "bnhub" | "fsbo">("all");
  const listings = useMemo(() => {
    const raw = layer === "all" ? [...bnhubPins, ...fsboPins] : layer === "bnhub" ? bnhubPins : fsboPins;
    return raw.map(toMapListing);
  }, [bnhubPins, fsboPins, layer]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Layer</span>
        {(["all", "bnhub", "fsbo"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setLayer(k)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium capitalize ${
              layer === k ? "bg-amber-500/20 text-amber-200" : "text-slate-500 hover:bg-white/5"
            }`}
          >
            {k === "bnhub" ? "BNHUB stays" : k === "fsbo" ? "FSBO / Buy" : "All"}
          </button>
        ))}
      </div>
      <div className="min-h-[480px] overflow-hidden rounded-xl border border-slate-800">
        <MapSearch listings={listings} variant="dark" className="h-[480px] w-full" />
      </div>
      <p className="text-xs text-slate-500">
        Showing up to 500 BNHUB and 500 FSBO listings with coordinates. Pan and zoom to inspect density.
      </p>
    </div>
  );
}

export function FlaggedIncidentsList({
  incidents,
}: {
  incidents: {
    id: string;
    incidentCategory: string;
    status: string;
    description: string;
    createdAt: Date;
    listing: { id: string; title: string; city: string | null } | null;
  }[];
}) {
  if (incidents.length === 0) {
    return <p className="text-sm text-slate-500">No open incidents matched noise / pet keywords.</p>;
  }
  return (
    <ul className="space-y-3">
      {incidents.map((i) => (
        <li key={i.id} className="rounded-lg border border-slate-800 bg-slate-900/50 p-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-mono text-xs text-slate-500">{i.id.slice(0, 8)}…</span>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{i.status}</span>
          </div>
          <p className="mt-1 text-slate-300">
            <span className="text-slate-500">Category:</span> {i.incidentCategory}
          </p>
          {i.listing ? (
            <p className="mt-1">
              <Link href={`/bnhub/${i.listing.id}`} className="text-amber-400 hover:underline">
                {i.listing.title}
              </Link>
              <span className="text-slate-500"> · {i.listing.city ?? "—"}</span>
            </p>
          ) : null}
          <p className="mt-2 line-clamp-3 text-xs text-slate-500">{i.description}</p>
          <p className="mt-1 text-[10px] text-slate-600">{new Date(i.createdAt).toLocaleString()}</p>
        </li>
      ))}
    </ul>
  );
}
