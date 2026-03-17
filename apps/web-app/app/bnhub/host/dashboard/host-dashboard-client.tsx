"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

type Listing = {
  id: string;
  title: string;
  city: string;
  nightPriceCents: number;
  verificationStatus: string;
  _count: { bookings: number; reviews: number };
};

function PricingWidget({ listings }: { listings: Listing[] }) {
  const [listingId, setListingId] = useState(listings[0]?.id ?? "");
  const [rec, setRec] = useState<{
    recommendedPriceCents: number;
    currentPriceCents: number;
    marketAvgCents: number;
    demandLevel: string;
    factors: string[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!listingId) return;
    setLoading(true);
    fetch(`/api/bnhub/pricing?listingId=${encodeURIComponent(listingId)}`)
      .then((r) => r.json())
      .then((data) => setRec(data.error ? null : data))
      .catch(() => setRec(null))
      .finally(() => setLoading(false));
  }, [listingId]);

  if (listings.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="text-lg font-semibold text-slate-100">Pricing intelligence</h2>
      <p className="mt-1 text-xs text-slate-500">Market-based price recommendations.</p>
      <div className="mt-3">
        <select
          value={listingId}
          onChange={(e) => setListingId(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
        >
          {listings.map((l) => (
            <option key={l.id} value={l.id}>{l.title}</option>
          ))}
        </select>
      </div>
      {loading && <p className="mt-2 text-sm text-slate-500">Loading…</p>}
      {rec && !loading && (
        <div className="mt-3 space-y-1 text-sm">
          <p className="text-slate-200">
            Recommended tonight: <span className="font-semibold text-emerald-300">${(rec.recommendedPriceCents / 100).toFixed(0)}</span>
          </p>
          <p className="text-slate-400">Current: ${(rec.currentPriceCents / 100).toFixed(0)} · Market avg: ${(rec.marketAvgCents / 100).toFixed(0)}</p>
          <p className="text-slate-400">Demand: <span className="capitalize">{rec.demandLevel}</span></p>
          <ul className="mt-2 list-inside list-disc text-xs text-slate-500">
            {rec.factors.slice(0, 2).map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function HostAiInsights({ listings }: { listings: Listing[] }) {
  const [listingId, setListingId] = useState(listings[0]?.id ?? "");
  const [recs, setRecs] = useState<{ type: string; priority: string; title: string; description: string; action?: string }[]>([]);
  const [demand, setDemand] = useState<{ demandLevel: string; highDemandDates: string[] } | null>(null);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [loadingDemand, setLoadingDemand] = useState(false);

  useEffect(() => {
    if (!listingId) return;
    setLoadingRecs(true);
    fetch(`/api/ai/recommendations/${listingId}`)
      .then((r) => r.json())
      .then((data) => setRecs(Array.isArray(data) ? data : data.recommendations ?? []))
      .catch(() => setRecs([]))
      .finally(() => setLoadingRecs(false));
  }, [listingId]);

  const city = listings.find((l) => l.id === listingId)?.city;
  useEffect(() => {
    if (!city) return;
    setLoadingDemand(true);
    fetch("/api/ai/demand", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ region: city }),
    })
      .then((r) => r.json())
      .then((data) => setDemand(data.error ? null : { demandLevel: data.demandLevel ?? "medium", highDemandDates: data.highDemandDates ?? [] }))
      .catch(() => setDemand(null))
      .finally(() => setLoadingDemand(false));
  }, [city]);

  if (listings.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="text-lg font-semibold text-slate-100">AI Insights</h2>
      <p className="mt-1 text-xs text-slate-500">Listing improvements, demand, and revenue tips.</p>
      <div className="mt-3">
        <select
          value={listingId}
          onChange={(e) => setListingId(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
        >
          {listings.map((l) => (
            <option key={l.id} value={l.id}>{l.title}</option>
          ))}
        </select>
      </div>
      {loadingRecs && <p className="mt-2 text-sm text-slate-500">Loading suggestions…</p>}
      {recs.length > 0 && !loadingRecs && (
        <div className="mt-3 space-y-2">
          <p className="text-xs font-medium text-slate-400">Listing improvements</p>
          <ul className="list-inside list-disc space-y-1 text-sm text-slate-300">
            {recs.slice(0, 4).map((r, i) => (
              <li key={i}>{r.title}: {r.description}</li>
            ))}
          </ul>
        </div>
      )}
      {demand && !loadingDemand && (
        <div className="mt-3 text-sm text-slate-400">
          <span className="font-medium text-slate-300">Demand in {city}:</span> {demand.demandLevel}
          {demand.highDemandDates.length > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              High-demand dates: {demand.highDemandDates.slice(0, 3).join(", ")}…
            </p>
          )}
        </div>
      )}
      <p className="mt-3 text-xs text-slate-500">
        Revenue tip: Use pricing suggestions above and keep your calendar updated for peak dates.
      </p>
    </div>
  );
}

function ReferralWidget({ ownerId }: { ownerId: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function generateCode() {
    setLoading(true);
    try {
      const res = await fetch("/api/bnhub/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referrerId: ownerId, rewardCreditsCents: 500 }),
      });
      const data = await res.json();
      if (data.code) setCode(data.code);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <h2 className="text-lg font-semibold text-slate-100">Invite hosts</h2>
      <p className="mt-1 text-xs text-slate-500">Share your referral code; you and the new host get booking credits.</p>
      {code ? (
        <p className="mt-2 font-mono text-sm text-emerald-300">{code}</p>
      ) : (
        <button
          type="button"
          onClick={generateCode}
          disabled={loading}
          className="mt-2 rounded-lg bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-600 disabled:opacity-50"
        >
          {loading ? "Generating…" : "Get referral code"}
        </button>
      )}
    </div>
  );
}

type Booking = {
  id: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  status: string;
  listing: { id: string; title: string };
  guest: { name: string | null; email: string };
  payment: { hostPayoutCents: number; status: string } | null;
};

export function HostDashboardClient({
  ownerId,
  listings,
  bookings,
}: {
  ownerId: string;
  listings: Listing[];
  bookings: Booking[];
}) {
  const [showAddListing, setShowAddListing] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  async function handleAddListing(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const res = await fetch("/api/bnhub/listings/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ownerId,
        title: data.get("title"),
        description: data.get("description") || undefined,
        address: data.get("address"),
        city: data.get("city"),
        country: data.get("country") || "US",
        nightPriceCents: Math.round(Number(data.get("nightPrice")) * 100),
        beds: Number(data.get("beds")),
        baths: Number(data.get("baths")),
        maxGuests: Number(data.get("maxGuests")) || 4,
        photos: (data.get("photos") as string)?.split(",").filter(Boolean) || [],
      }),
    });
    if (res.ok) {
      setAddSuccess(true);
      form.reset();
      setShowAddListing(false);
      window.location.reload();
    }
  }

  return (
    <div className="space-y-10">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-100">Your listings</h2>
          <div className="flex items-center gap-2">
            <Link
              href="/bnhub/host/listings/new"
              className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
            >
              Create listing (wizard)
            </Link>
            <button
              type="button"
              onClick={() => setShowAddListing(!showAddListing)}
              className="rounded-xl border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800"
            >
              {showAddListing ? "Cancel" : "+ Quick add"}
            </button>
          </div>
        </div>

        {showAddListing && (
          <form onSubmit={handleAddListing} className="mt-4 rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-4">
            <input name="title" required placeholder="Title" className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100" />
            <textarea name="description" placeholder="Description" rows={2} className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100" />
            <input name="address" required placeholder="Address" className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100" />
            <div className="grid grid-cols-2 gap-4">
              <input name="city" required placeholder="City" className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100" />
              <input name="country" placeholder="Country" defaultValue="US" className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs text-slate-500">Night price ($)</label>
                <input name="nightPrice" type="number" required min="1" step="0.01" placeholder="100" className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Max guests</label>
                <input name="maxGuests" type="number" min="1" defaultValue="4" className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs text-slate-500">Beds</label>
                <input name="beds" type="number" required min="0" className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-slate-500">Baths</label>
                <input name="baths" type="number" required min="0" step="0.5" className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">Photo URLs (comma-separated)</label>
              <input name="photos" placeholder="https://..." className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100" />
            </div>
            <button type="submit" className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400">
              Create listing
            </button>
          </form>
        )}

        {addSuccess && <p className="mt-2 text-sm text-emerald-400">Listing added. Refreshing…</p>}

        <ul className="mt-4 space-y-3">
          {listings.length === 0 && !showAddListing && (
            <li className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-center text-slate-500">
              No listings yet. Add one above.
            </li>
          )}
          {listings.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div>
                <Link href={`/bnhub/${l.id}`} className="font-medium text-slate-100 hover:text-emerald-300">
                  {l.title}
                </Link>
                <p className="text-sm text-slate-500">{l.city} · ${(l.nightPriceCents / 100).toFixed(0)}/night</p>
                <p className="text-xs text-slate-600">{l._count.bookings} bookings · {l._count.reviews} reviews</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {l.verificationStatus === "VERIFIED" && (
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-medium text-emerald-300">
                    Verified
                  </span>
                )}
                <Link
                  href={`/bnhub/host/listings/${l.id}/edit`}
                  className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  Edit
                </Link>
                <Link
                  href={`/bnhub/host/listings/${l.id}/availability`}
                  className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  Calendar
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-100">Bookings</h2>
        <ul className="mt-4 space-y-3">
          {bookings.length === 0 && (
            <li className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-center text-slate-500">
              No bookings yet.
            </li>
          )}
          {bookings.map((b) => (
            <li key={b.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <p className="font-medium text-slate-100">{b.listing.title}</p>
              <p className="text-sm text-slate-400">
                {new Date(b.checkIn).toLocaleDateString()} – {new Date(b.checkOut).toLocaleDateString()} · {b.nights} nights
              </p>
              <p className="text-sm text-slate-400">Guest: {b.guest.name ?? b.guest.email}</p>
              <p className="mt-1 text-xs text-slate-500">
                Status: <span className="capitalize">{b.status.toLowerCase()}</span>
                {b.payment?.status === "COMPLETED" && (
                  <span className="ml-2 text-emerald-400">Payout ${(b.payment.hostPayoutCents / 100).toFixed(0)}</span>
                )}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <PricingWidget listings={listings} />
      <HostAiInsights listings={listings} />
      <ReferralWidget ownerId={ownerId} />
      <div className="flex flex-wrap gap-4">
        <Link
          href="/messages"
          className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
        >
          Messages
        </Link>
        <Link
          href="/bnhub/host/incident"
          className="text-sm font-medium text-slate-400 hover:text-slate-300"
        >
          Report incident
        </Link>
      </div>
      <p className="text-xs text-slate-500">
        Payments integrate with Stripe when configured.
      </p>
    </div>
  );
}
