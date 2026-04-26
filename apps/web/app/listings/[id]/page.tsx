"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

export default function ListingPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";
  const [listing, setListing] = useState<{
    id: string;
    title: string;
    city: string;
    price: number;
  } | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch("/api/listings")
      .then((r) => r.json())
      .then((data: { id: string; title: string; city: string; price: number }[]) => {
        if (!Array.isArray(data)) {
          setListing(null);
          return;
        }
        const found = data.find((l) => l.id === id);
        setListing(found ?? null);
      })
      .catch(() => setListing(null))
      .finally(() => setReady(true));
  }, [id]);

  if (!id) {
    return (
      <div style={{ padding: 40 }}>
        <p>Loading…</p>
      </div>
    );
  }

  if (!ready) {
    return (
      <div style={{ padding: 40 }}>
        <p>Loading...</p>
        <Link href="/listings">Back to listings</Link>
      </div>
    );
  }

  if (!listing) {
    return (
      <div style={{ padding: 40 }}>
        <p>Listing not found.</p>
        <Link href="/listings">Back to listings</Link>
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <nav style={{ marginBottom: 16 }}>
        <Link href="/listings">← Listings</Link>
      </nav>
      <h1>{listing.title}</h1>
      <p>{listing.city}</p>
      <p>${listing.price}</p>

      <p style={{ marginTop: 24 }}>
        <Link href={`/book/${listing.id}`}>Book Now</Link>
      </p>
    </div>
  );
}
