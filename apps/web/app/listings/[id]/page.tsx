"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { TrustBadges } from "@/components/listing/TrustBadges";
import { generateUrgency } from "@/lib/ai/urgency";

type Listing = {
  id: string;
  title: string;
  city: string;
  price: number;
};

export default function ListingPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const [listing, setListing] = useState<Listing | null>(null);
  const [ready, setReady] = useState(false);
  const [bookingCount, setBookingCount] = useState(0);

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
          setListing(data as Listing);
        } else {
          setListing(null);
        }
      })
      .catch(() => setListing(null))
      .finally(() => setReady(true));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetch(
      `/api/listings/${id}/bookings?from=${encodeURIComponent("2000-01-01")}&to=${encodeURIComponent("2100-12-31")}`
    )
      .then((r) => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) setBookingCount(data.length);
        else setBookingCount(0);
      })
      .catch(() => setBookingCount(0));
  }, [id]);

  const urgencyMessages = useMemo(
    () => generateUrgency({ bookings: bookingCount, views: undefined }),
    [bookingCount]
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

        {urgencyMessages.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {urgencyMessages.map((m) => (
              <span key={m} className="text-sm font-medium text-red-600 dark:text-red-500">
                {m}
              </span>
            ))}
          </div>
        ) : null}

        <TrustBadges />

        <p className="mt-8">
          <Link
            className="inline-flex rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            href={`/book/${listing.id}`}
          >
            Book now
          </Link>
        </p>
      </div>
    </div>
  );
}
