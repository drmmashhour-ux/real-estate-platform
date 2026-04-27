"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { TrustBadges } from "@/components/listing/TrustBadges";
import { BookNowCTA } from "@/components/listing/BookNowCTA";
import { HelpBanner } from "@/components/support/HelpBanner";
import { getDealLabel } from "@/lib/ai/dealScore";

type Listing = {
  id: string;
  title: string;
  city: string;
  price: number;
  dealHighlightScore?: number;
  marketPrice?: number | null;
  highlight?: string | null;
};

export default function ListingPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const [listing, setListing] = useState<Listing | null>(null);
  const [ready, setReady] = useState(false);
  const [availability, setAvailability] = useState<{
    nextAvailableDate: string | null;
    occupancyRate: number;
    urgency: string | null;
  } | null>(null);

  useEffect(() => {
    if (!id) return;
    setReady(false);
    fetch(`/api/listings/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (
          data &&
          typeof data === "object" &&
          typeof (data as Listing).id === "string" &&
          typeof (data as Listing).title === "string" &&
          typeof (data as Listing).city === "string" &&
          typeof (data as Listing).price === "number"
        ) {
          const row = data as Record<string, unknown> & Listing;
          setListing({
            id: row.id,
            title: row.title,
            city: row.city,
            price: row.price,
            dealHighlightScore:
              typeof row.dealHighlightScore === "number" ? row.dealHighlightScore : undefined,
            marketPrice: typeof row.marketPrice === "number" ? row.marketPrice : null,
            highlight: typeof row.highlight === "string" ? row.highlight : null,
          });
        } else {
          setListing(null);
        }
      })
      .catch(() => setListing(null))
      .finally(() => setReady(true));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/listings/${id}/availability`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: unknown) => {
        if (data && typeof data === "object" && "occupancyRate" in data) {
          const o = data as {
            nextAvailableDate?: string | null;
            occupancyRate: number;
            urgency?: string | null;
          };
          setAvailability({
            nextAvailableDate: o.nextAvailableDate ?? null,
            occupancyRate: typeof o.occupancyRate === "number" ? o.occupancyRate : 0,
            urgency: o.urgency ?? null,
          });
        } else {
          setAvailability(null);
        }
      })
      .catch(() => setAvailability(null));
  }, [id]);

  const dealLabel = useMemo(
    () =>
      typeof listing?.dealHighlightScore === "number"
        ? getDealLabel(listing.dealHighlightScore)
        : null,
    [listing]
  );

  if (!id) {
    return (
      <div className="p-10">
        <p>Loading…</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="p-10">
        <p>Loading…</p>
        <Link className="text-blue-600 underline" href="/listings">
          Back to listings
        </Link>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="p-10">
        <p>Listing not found.</p>
        <Link className="text-blue-600 underline" href="/listings">
          Back to listings
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10 dark:bg-zinc-950">
      <div className="mx-auto max-w-2xl">
        <nav className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          <Link className="hover:text-zinc-900 dark:hover:text-zinc-100" href="/listings">
            ← Listings
          </Link>
        </nav>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">{listing.title}</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">{listing.city}</p>
        <p className="mt-2 text-lg font-medium text-zinc-900 dark:text-zinc-100">
          ${listing.price}
          <span className="text-sm font-normal text-zinc-500"> / night</span>
        </p>
        {dealLabel ? (
          <span className="mt-1 block text-sm text-green-600 dark:text-green-500">{dealLabel}</span>
        ) : null}
        {listing.highlight ? (
          <p className="mt-1 text-sm text-green-600 dark:text-green-400">{listing.highlight}</p>
        ) : null}

        {availability ? (
          <div className="mt-3 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
            {availability.nextAvailableDate ? (
              <p>
                <span className="text-zinc-500">Next available: </span>
                {new Date(availability.nextAvailableDate).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                })}
              </p>
            ) : null}
            <p>
              <span className="text-zinc-500">This month: </span>
              {Math.min(100, Math.round(availability.occupancyRate * 100))}% booked
              <span className="text-zinc-500"> (trailing 30 days)</span>
            </p>
            {availability.urgency ? (
              <p className="font-medium text-amber-800 dark:text-amber-200/90">{availability.urgency}</p>
            ) : null}
          </div>
        ) : null}

        <div className="sticky top-0 z-30 -mx-4 space-y-3 border-b border-zinc-200/90 bg-zinc-50/95 px-4 py-4 shadow-sm backdrop-blur-md dark:border-zinc-800/90 dark:bg-zinc-950/95 sm:mx-0 sm:px-0">
          <BookNowCTA listingId={listing.id} className="mt-0" />
          <HelpBanner className="mt-0" />
        </div>

        <TrustBadges />
      </div>
    </div>
  );
}
