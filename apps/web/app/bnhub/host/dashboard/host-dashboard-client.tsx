"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CopyListingCodeButton } from "@/components/bnhub/CopyListingCodeButton";
import { HubAiDock } from "@/components/ai/HubAiDock";

type Listing = {
  id: string;
  listingCode?: string | null;
  title: string;
  city: string;
  nightPriceCents: number;
  verificationStatus: string;
  externalSyncEnabled?: boolean;
  _count: { bookings: number; reviews: number };
};

function ExternalSyncPanel({ listings }: { listings: Listing[] }) {
  const [states, setStates] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(listings.map((l) => [l.id, Boolean(l.externalSyncEnabled)]))
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setStates(Object.fromEntries(listings.map((l) => [l.id, Boolean(l.externalSyncEnabled)])));
  }, [listings]);

  if (listings.length === 0) return null;

  async function toggle(listingId: string, value: boolean) {
    setSaving(listingId);
    setMessage(null);
    try {
      const res = await fetch("/api/bnhub/host/external-sync", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ listingId, externalSyncEnabled: value }),
      });
      if (!res.ok) throw new Error("save_failed");
      setStates((s) => ({ ...s, [listingId]: value }));
      setMessage("Saved.");
    } catch {
      setMessage("Could not update. Sign in as the listing owner and try again.");
    } finally {
      setSaving(null);
    }
  }

  return (
    <section className="rounded-2xl border border-indigo-500/25 bg-indigo-950/20 p-5">
      <h2 className="text-lg font-semibold text-white">External sync</h2>
      <p className="mt-1 text-sm text-slate-400">
        Prepare for Booking.com, Airbnb, and Expedia via channel manager. When enabled, availability can be pushed and
        updated from inbound webhooks at <code className="text-indigo-300">/api/integrations/webhook</code>.
      </p>
      {message && <p className="mt-2 text-sm text-slate-400">{message}</p>}
      <ul className="mt-4 divide-y divide-slate-800/80">
        {listings.map((l) => (
          <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0">
            <div>
              <p className="font-medium text-slate-200">{l.title}</p>
              <p className="text-xs text-slate-500">{l.city}</p>
            </div>
            <label className="flex cursor-pointer items-center gap-2">
              <span className="text-sm text-slate-400">Sync</span>
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                checked={states[l.id] ?? false}
                disabled={saving === l.id}
                onChange={(e) => void toggle(l.id, e.target.checked)}
              />
            </label>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Link
          href="/bnhub/host/channel-manager"
          className="inline-flex rounded-xl bg-amber-500/20 px-4 py-2 text-sm font-semibold text-amber-200 ring-1 ring-amber-500/40 hover:bg-amber-500/30"
        >
          Channel manager &amp; iCal
        </Link>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        Map external property IDs in <code className="text-slate-400">external_mapping</code> (admin / tooling). Sync
        errors are logged in <code className="text-slate-400">bnhub_channel_sync_logs</code>.
      </p>
    </section>
  );
}

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
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
      <h3 className="text-base font-semibold text-white">AI insights</h3>
      <p className="mt-1 text-xs text-slate-500">AI insights — informational only</p>
      <div className="mt-2">
        <p className="text-xs font-medium text-slate-400">Pricing suggestions</p>
      </div>
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
      <h2 className="text-lg font-semibold text-slate-100">AI insights</h2>
      <p className="mt-1 text-xs text-slate-500">AI insights — informational only</p>
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
      {recs.length > 0 && !loadingRecs && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-slate-400">Improvement tips</p>
          <ul className="list-inside list-disc space-y-1 text-sm text-slate-300">
            {recs.slice(0, 5).map((r, i) => (
              <li key={i}>{r.title}: {r.description}</li>
            ))}
          </ul>
        </div>
      )}
      {loadingRecs && <p className="mt-2 text-sm text-slate-500">Loading suggestions…</p>}
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
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
      <h3 className="text-base font-semibold text-white">Invite hosts</h3>
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
  guestNotes?: string | null;
  specialRequest?: string | null;
  specialRequestsJson?: unknown;
  listing: { id: string; title: string };
  guest: { name: string | null; email: string };
  payment: { hostPayoutCents: number | null; status: string } | null;
};

function SpecialRequestsBlock({ booking }: { booking: Booking }) {
  const raw = booking.specialRequestsJson;
  const obj =
    raw && typeof raw === "object" && raw !== null && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : null;
  const services = obj?.services && typeof obj.services === "object" && obj.services !== null
    ? (obj.services as Record<string, unknown>)
    : null;
  const svcBits: string[] = [];
  if (services?.airportPickup === true) svcBits.push("Airport pickup");
  if (services?.parking === true) svcBits.push("Parking");
  if (services?.shuttle === true) svcBits.push("Shuttle");
  const extra =
    typeof obj?.extraServices === "string" && obj.extraServices.trim()
      ? obj.extraServices.trim()
      : null;
  const guestPet = obj?.guestPet && typeof obj.guestPet === "object" && obj.guestPet !== null
    ? (obj.guestPet as Record<string, unknown>)
    : null;
  const petLine =
    guestPet?.travelingWithPet === true
      ? [
          "Pet:",
          typeof guestPet.type === "string" ? guestPet.type : "?",
          guestPet.weightKg != null && guestPet.weightKg !== ""
            ? `${String(guestPet.weightKg)} kg`
            : "weight n/a",
        ].join(" ")
      : null;

  const sr = booking.specialRequest?.trim() ?? "";
  const gn = booking.guestNotes?.trim() ?? "";
  const freeText = sr && gn && sr === gn ? sr : [sr, gn].filter(Boolean).join("\n\n").trim();

  if (!svcBits.length && !extra && !petLine && !freeText) return null;

  return (
    <div className="mt-3 rounded-lg border border-slate-700/80 bg-slate-950/40 p-3 text-xs text-slate-400">
      <p className="font-medium text-slate-300">Guest requests &amp; notes</p>
      {svcBits.length > 0 && (
        <p className="mt-1.5">
          <span className="text-slate-500">Services: </span>
          {svcBits.join(" · ")}
        </p>
      )}
      {extra && (
        <p className="mt-1">
          <span className="text-slate-500">Extras: </span>
          {extra}
        </p>
      )}
      {petLine && <p className="mt-1">{petLine}</p>}
      {freeText && (
        <p className="mt-2 whitespace-pre-wrap text-slate-400">
          <span className="text-slate-500">Notes: </span>
          {freeText}
        </p>
      )}
    </div>
  );
}

function StripeConnectPanel({
  canManage,
  initial,
}: {
  canManage: boolean;
  initial: { stripeAccountId: string | null; stripeOnboardingComplete: boolean };
}) {
  const [connected, setConnected] = useState(Boolean(initial.stripeAccountId));
  const [onboardingComplete, setOnboardingComplete] = useState(
    Boolean(initial.stripeOnboardingComplete)
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setConnected(Boolean(initial.stripeAccountId));
    setOnboardingComplete(Boolean(initial.stripeOnboardingComplete));
  }, [initial.stripeAccountId, initial.stripeOnboardingComplete]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    if (p.get("stripe_connect") !== "return" && p.get("stripe_connect") !== "refresh")
      return;

    fetch("/api/stripe/connect/status")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d.connected === "boolean") setConnected(d.connected);
        if (typeof d.onboardingComplete === "boolean")
          setOnboardingComplete(d.onboardingComplete);
      })
      .catch(() => {})
      .finally(() => {
        window.history.replaceState({}, "", "/bnhub/host/dashboard");
      });
    // New onboarding return URL: /dashboard/host/payouts?connected=1 (handled on payouts page).
  }, []);

  async function startOnboard() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/connect/onboard", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not start Stripe onboarding");
        return;
      }
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(false);
    }
  }

  const statusLabel = onboardingComplete
    ? "Active"
    : connected
      ? "Pending onboarding"
      : "Not connected";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
      <h2 className="text-lg font-semibold text-white">Payouts (Stripe Connect)</h2>
      <p className="mt-2 text-xs font-medium text-slate-300">
        Stripe status:{" "}
        <span
          className={
            onboardingComplete
              ? "text-emerald-400"
              : connected
                ? "text-amber-300"
                : "text-slate-400"
          }
        >
          {statusLabel}
        </span>
      </p>
      <p className="mt-1 text-sm text-slate-400">
        Connect your Stripe account so guests can pay and you receive payouts automatically. Platform
        fee is configurable (default 15%). Use the full payouts dashboard for earnings detail.
      </p>
      <p className="mt-2 text-xs">
        <a
          href="/dashboard/host/payouts"
          className="font-medium text-emerald-400 underline hover:text-emerald-300"
        >
          Open payouts & earnings →
        </a>
      </p>
      {!canManage && (
        <p className="mt-3 text-xs text-amber-400/90">
          Sign in as this host to connect or manage Stripe.
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {onboardingComplete ? (
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-medium text-emerald-300">
            Stripe connected — ready for payouts
          </span>
        ) : connected ? (
          <span className="rounded-full bg-amber-500/20 px-3 py-1 text-sm font-medium text-amber-300">
            Finish Stripe setup to accept paid bookings
          </span>
        ) : (
          <span className="rounded-full bg-slate-700 px-3 py-1 text-sm text-slate-300">
            Not connected
          </span>
        )}
        {canManage && !onboardingComplete && (
          <button
            type="button"
            onClick={startOnboard}
            disabled={loading}
            className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
          >
            {loading ? "Opening Stripe…" : connected ? "Complete payout setup" : "Connect Stripe account"}
          </button>
        )}
      </div>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </div>
  );
}

export function HostDashboardClient({
  ownerId,
  listings,
  bookings,
  canManageStripe,
  hostStripe,
}: {
  ownerId: string;
  listings: Listing[];
  bookings: Booking[];
  canManageStripe: boolean;
  hostStripe: { stripeAccountId: string | null; stripeOnboardingComplete: boolean };
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
    <div className="space-y-12">
      <StripeConnectPanel canManage={canManageStripe} initial={hostStripe} />

      <ExternalSyncPanel listings={listings} />

      {listings[0] ? (
        <HubAiDock
          hub="bnhub"
          accent="#34d399"
          context={{
            listingId: listings[0].id,
            title: listings[0].title,
            city: listings[0].city,
            nightPriceCents: listings[0].nightPriceCents,
            surface: "host_dashboard",
          }}
        />
      ) : null}

      {/* Your listings */}
      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-white">Your listings</h2>
          <div className="flex items-center gap-2">
            <Link
              href="/bnhub/host/listings/new"
              className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
            >
              Create listing (wizard)
            </Link>
            <button
              type="button"
              onClick={() => setShowAddListing(!showAddListing)}
              className="rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:border-slate-500"
            >
              {showAddListing ? "Cancel" : "+ Quick add"}
            </button>
          </div>
        </div>

        {showAddListing && (
          <form onSubmit={handleAddListing} className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-6 space-y-4">
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

        <ul className="space-y-3">
          {listings.length === 0 && !showAddListing && (
            <li className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-center text-slate-500">
              No listings yet. Add one above.
            </li>
          )}
          {listings.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 p-4 transition hover:border-slate-700">
              <div>
                <Link href={`/bnhub/${l.id}`} className="font-medium text-slate-100 hover:text-emerald-300">
                  {l.title}
                </Link>
                <p className="text-sm text-slate-500">{l.city} · ${(l.nightPriceCents / 100).toFixed(0)}/night</p>
                {l.listingCode ? (
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-slate-500">ID {l.listingCode}</span>
                    <CopyListingCodeButton listingCode={l.listingCode} variant="light" className="!py-1 !px-2" />
                  </div>
                ) : null}
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
                <Link
                  href="/bnhub/host/channel-manager"
                  className="rounded-lg border border-amber-600/50 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/10"
                >
                  Channels
                </Link>
                <Link
                  href={`/dashboard/listings/${l.id}`}
                  className="rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/30"
                >
                  AI + Poster
                </Link>
                <Link
                  href={`/tools/design-studio?listingId=${encodeURIComponent(l.id)}`}
                  className="rounded-lg border border-amber-600/60 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/20"
                >
                  Design Studio
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Bookings */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Bookings</h2>
        <ul className="space-y-3">
          {bookings.length === 0 && (
            <li className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-center text-slate-500">
              No bookings yet.
            </li>
          )}
          {bookings.map((b) => (
            <li key={b.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 transition hover:border-slate-700">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-100">{b.listing.title}</p>
                  <p className="text-sm text-slate-400">
                    {new Date(b.checkIn).toLocaleDateString()} – {new Date(b.checkOut).toLocaleDateString()} · {b.nights}{" "}
                    nights
                  </p>
                  <p className="text-sm text-slate-400">
                    Guest: <span className="text-slate-300">{b.guest.name ?? "—"}</span> · {b.guest.email}
                  </p>
                </div>
                <div className="text-right text-xs">
                  <p className="text-slate-500">
                    Booking: <span className="capitalize text-slate-300">{b.status.toLowerCase().replace(/_/g, " ")}</span>
                  </p>
                  <p className="mt-0.5 text-slate-500">
                    Payment:{" "}
                    <span
                      className={
                        b.payment?.status === "COMPLETED"
                          ? "text-emerald-400"
                          : b.payment?.status === "PENDING"
                            ? "text-amber-300"
                            : "text-slate-400"
                      }
                    >
                      {(b.payment?.status ?? "—").toLowerCase()}
                    </span>
                    {b.payment?.status === "COMPLETED" && b.payment.hostPayoutCents != null ? (
                      <span className="ml-1 text-emerald-400/90">
                        · Est. payout ${((b.payment.hostPayoutCents ?? 0) / 100).toFixed(0)}
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>
              <SpecialRequestsBlock booking={b} />
            </li>
          ))}
        </ul>
      </section>

      {/* Tools grid */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-white">Tools & insights</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <PricingWidget listings={listings} />
          <HostAiInsights listings={listings} />
          <ReferralWidget ownerId={ownerId} />
        </div>
      </section>

      {/* Footer links */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 pt-6">
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
          <Link
            href="/bnhub/stays"
            className="text-sm font-medium text-slate-400 hover:text-slate-300"
          >
            Find a stay
          </Link>
        </div>
        <p className="text-xs text-slate-500">
          Payments integrate with Stripe when configured.
        </p>
      </div>
    </div>
  );
}
