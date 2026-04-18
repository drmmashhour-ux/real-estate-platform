"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { CopyListingCodeButton } from "@/components/bnhub/CopyListingCodeButton";
import { HubAiDock } from "@/components/ai/HubAiDock";
import { HostVenueModeBar } from "@/components/bnhub/HostVenueModeBar";
import { HostDashboardV2 } from "@/components/bnhub-host/HostDashboardV2";

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
    <section className="bnhub-panel p-5">
      <h2 className="text-lg font-semibold tracking-tight text-white">External sync</h2>
      <p className="mt-1 text-sm text-neutral-400">
        Prepare for Booking.com, Airbnb, and Expedia via channel manager. When enabled, availability can be pushed and
        updated from inbound webhooks at <code className="font-mono text-xs text-premium-gold/90">/api/integrations/webhook</code>.
      </p>
      {message && <p className="mt-2 text-sm text-neutral-400">{message}</p>}
      <ul className="mt-4 divide-y divide-white/10">
        {listings.map((l) => (
          <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0">
            <div>
              <p className="font-medium text-neutral-100">{l.title}</p>
              <p className="text-xs text-neutral-500">{l.city}</p>
            </div>
            <label className="flex cursor-pointer items-center gap-2">
              <span className="text-sm text-neutral-400">Sync</span>
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-premium-gold/30 bg-black text-premium-gold focus:ring-premium-gold/40"
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
          className="lecipm-prestige-pill lecipm-neon-white-muted inline-flex px-4 py-2 text-sm"
        >
          Channel manager and iCal
        </Link>
      </div>
      <p className="mt-3 text-xs text-neutral-500">
        Map OTA IDs with{" "}
        <code className="text-premium-gold/80">POST /api/bnhub/host/ota-ai/parse</code> (AI + rules) then{" "}
        <code className="text-premium-gold/80">…/external-mapping</code>. Legacy: <code className="text-premium-gold/80">external_mapping</code>. Sync
        errors are logged in <code className="text-premium-gold/80">bnhub_channel_sync_logs</code>.
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
  const [hostInsight, setHostInsight] = useState<{
    hostBullets: string[];
    disclaimer: string;
    aiEnhanced?: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingInsight, setLoadingInsight] = useState(false);

  useEffect(() => {
    if (!listingId) return;
    setLoading(true);
    fetch(`/api/bnhub/pricing?listingId=${encodeURIComponent(listingId)}`)
      .then((r) => r.json())
      .then((data) => setRec(data.error ? null : data))
      .catch(() => setRec(null))
      .finally(() => setLoading(false));
  }, [listingId]);

  useEffect(() => {
    if (!listingId) return;
    setLoadingInsight(true);
    fetch(`/api/bnhub/host/listings/${encodeURIComponent(listingId)}/market-insight`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) =>
        setHostInsight(
          data.error
            ? null
            : {
                hostBullets: Array.isArray(data.hostBullets) ? data.hostBullets : [],
                disclaimer: typeof data.disclaimer === "string" ? data.disclaimer : "",
                aiEnhanced: Boolean(data.aiEnhanced),
              }
        )
      )
      .catch(() => setHostInsight(null))
      .finally(() => setLoadingInsight(false));
  }, [listingId]);

  if (listings.length === 0) return null;

  return (
    <div className="bnhub-panel-muted p-4">
      <h3 className="text-base font-semibold tracking-tight text-white">AI insights</h3>
      <p className="mt-1 text-xs text-neutral-500">Informational only — not financial advice</p>
      <div className="mt-2">
        <p className="text-xs font-medium text-neutral-400">Pricing suggestions</p>
      </div>
      <div className="mt-3">
        <select
          value={listingId}
          onChange={(e) => setListingId(e.target.value)}
          className="bnhub-input max-w-full"
        >
          {listings.map((l) => (
            <option key={l.id} value={l.id}>{l.title}</option>
          ))}
        </select>
      </div>
      {loading && <p className="mt-2 text-sm text-neutral-500">Loading…</p>}
      {rec && !loading && (
        <div className="mt-3 space-y-1 text-sm">
          <p className="text-neutral-200">
            Recommended tonight:{" "}
            <span className="font-semibold text-premium-gold">${(rec.recommendedPriceCents / 100).toFixed(0)}</span>
          </p>
          <p className="text-neutral-400">
            Current: ${(rec.currentPriceCents / 100).toFixed(0)} · Market avg: ${(rec.marketAvgCents / 100).toFixed(0)}
          </p>
          <p className="text-neutral-400">
            Demand: <span className="capitalize">{rec.demandLevel}</span>
          </p>
          <ul className="mt-2 list-inside list-disc text-xs text-neutral-500">
            {rec.factors.slice(0, 4).map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}
      {loadingInsight && <p className="mt-3 text-xs text-neutral-500">Loading market comparison…</p>}
      {hostInsight && hostInsight.hostBullets.length > 0 && !loadingInsight && (
        <div className="mt-4 border-t border-white/10 pt-3">
          <p className="text-xs font-medium text-neutral-400">
            vs BNHUB market {hostInsight.aiEnhanced ? "(AI-polished copy)" : ""}
          </p>
          <ul className="mt-2 list-inside list-disc text-xs text-neutral-300">
            {hostInsight.hostBullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
          {hostInsight.disclaimer ? (
            <p className="mt-2 text-[10px] leading-snug text-neutral-600">{hostInsight.disclaimer}</p>
          ) : null}
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
    <div className="bnhub-panel-muted p-4">
      <h2 className="text-lg font-semibold tracking-tight text-white">AI insights</h2>
      <p className="mt-1 text-xs text-neutral-500">Informational only</p>
      <div className="mt-3">
        <select
          value={listingId}
          onChange={(e) => setListingId(e.target.value)}
          className="bnhub-input max-w-full"
        >
          {listings.map((l) => (
            <option key={l.id} value={l.id}>{l.title}</option>
          ))}
        </select>
      </div>
      {recs.length > 0 && !loadingRecs && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-medium text-neutral-400">Improvement tips</p>
          <ul className="list-inside list-disc space-y-1 text-sm text-neutral-300">
            {recs.slice(0, 5).map((r, i) => (
              <li key={i}>{r.title}: {r.description}</li>
            ))}
          </ul>
        </div>
      )}
      {loadingRecs && <p className="mt-2 text-sm text-neutral-500">Loading suggestions…</p>}
      {demand && !loadingDemand && (
        <div className="mt-3 text-sm text-neutral-400">
          <span className="font-medium text-neutral-200">Demand in {city}:</span> {demand.demandLevel}
          {demand.highDemandDates.length > 0 && (
            <p className="mt-1 text-xs text-neutral-500">
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
    <div className="bnhub-panel-muted p-4">
      <h3 className="text-base font-semibold tracking-tight text-white">Invite hosts</h3>
      <p className="mt-1 text-xs text-neutral-500">Share your referral code; you and the new host get booking credits.</p>
      {code ? (
        <p className="mt-2 font-mono text-sm text-premium-gold">{code}</p>
      ) : (
        <button
          type="button"
          onClick={generateCode}
          disabled={loading}
          className="lecipm-touch mt-2 rounded-lg border border-premium-gold/35 bg-premium-gold/10 px-3 py-1.5 text-sm font-medium text-premium-gold hover:bg-premium-gold/15 disabled:opacity-50"
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
  guest: {
    name: string | null;
    email: string;
    homeCity?: string | null;
    homeRegion?: string | null;
    homeCountry?: string | null;
  };
  payment: {
    hostPayoutCents: number | null;
    status: string;
    platformFeeCents?: number | null;
    scheduledHostPayoutAt?: Date | string | null;
    hostPayoutReleasedAt?: Date | string | null;
    payoutHoldReason?: string | null;
    stripeReceiptUrl?: string | null;
    stripeConnectAccountId?: string | null;
  } | null;
  bnhubReservationPayment?:
    | {
        paymentStatus: string;
        amountCapturedCents: number | null;
        amountRefundedCents: number | null;
      }
    | null;
};

function getHostPaymentSummary(booking: Booking) {
  const mp = booking.bnhubReservationPayment?.paymentStatus;
  if (mp === "PAID") return { label: "Guest paid", tone: "text-premium-gold" };
  if (mp === "PROCESSING") return { label: "Checkout processing", tone: "text-neutral-400" };
  if (mp === "REQUIRES_ACTION") return { label: "Awaiting guest payment", tone: "text-premium-gold/75" };
  if (mp === "FAILED") return { label: "Payment failed", tone: "text-red-400" };
  if (booking.payment?.status === "COMPLETED") return { label: "Paid", tone: "text-premium-gold" };
  if (booking.payment?.status === "PENDING") return { label: "Pending", tone: "text-premium-gold/70" };
  return { label: booking.payment?.status ?? "—", tone: "text-neutral-500" };
}

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
    <div className="bnhub-panel-muted mt-3 p-3 text-xs text-neutral-400">
      <p className="font-medium text-neutral-200">Guest requests and notes</p>
      {svcBits.length > 0 && (
        <p className="mt-1.5">
          <span className="text-neutral-500">Services: </span>
          {svcBits.join(" · ")}
        </p>
      )}
      {extra && (
        <p className="mt-1">
          <span className="text-neutral-500">Extras: </span>
          {extra}
        </p>
      )}
      {petLine && <p className="mt-1">{petLine}</p>}
      {freeText && (
        <p className="mt-2 whitespace-pre-wrap text-neutral-400">
          <span className="text-neutral-500">Notes: </span>
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

  const statusLabel = onboardingComplete ? "ACTIVE" : connected ? "PENDING_SETUP" : "NOT_CONNECTED";
  const statusHuman = onboardingComplete
    ? "Active — payouts authorized"
    : connected
      ? "Connected — finish Stripe requirements"
      : "Not connected";

  return (
    <div className="bnhub-stripe-panel p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-premium-gold/15 pb-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-premium-gold/75">Payments infrastructure</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">Stripe Connect (payouts)</h2>
          <p className="mt-2 max-w-xl text-sm text-neutral-400">
            Required for paid guest checkouts. Funds flow guest → Stripe → your account; platform fee applies per booking.
            Same gold-trim system as BNHUB search and strips — serious money, clear state.
          </p>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-2">
          <dt className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">Stripe status</dt>
          <dd className="mt-1 font-mono text-sm text-premium-gold">{statusLabel}</dd>
          <dd className="mt-0.5 text-xs text-neutral-400">{statusHuman}</dd>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/40 px-3 py-2">
          <dt className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">Documentation</dt>
          <dd className="mt-1">
            <a
              href="/dashboard/host/payouts"
              className="text-sm font-medium text-premium-gold underline-offset-2 hover:underline"
            >
              Payouts and earnings detail →
            </a>
          </dd>
        </div>
      </dl>

      {!canManage && (
        <p className="mt-4 text-xs text-premium-gold/85">Sign in as this host to connect or manage Stripe.</p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        {onboardingComplete ? (
          <span className="rounded-full border border-premium-gold/35 bg-premium-gold/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-premium-gold">
            Ready for payouts
          </span>
        ) : connected ? (
          <span className="rounded-full border border-premium-gold/25 bg-black/50 px-3 py-1.5 text-xs font-medium text-neutral-200">
            Finish Stripe setup to accept paid bookings
          </span>
        ) : (
          <span className="rounded-full border border-white/15 bg-black/40 px-3 py-1.5 text-xs font-medium text-neutral-400">
            Not connected
          </span>
        )}
        {canManage && !onboardingComplete && (
          <button
            type="button"
            onClick={startOnboard}
            disabled={loading}
            className="lecipm-touch rounded-lg bg-premium-gold px-5 py-2.5 text-sm font-semibold text-black hover:brightness-95 disabled:opacity-50"
          >
            {loading ? "Opening Stripe…" : connected ? "Complete payout setup" : "Connect Stripe account"}
          </button>
        )}
      </div>
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
    </div>
  );
}

export function HostDashboardClient({
  ownerId,
  listings,
  bookings,
  canManageStripe,
  hostStripe,
  bnhubV2,
}: {
  ownerId: string;
  listings: Listing[];
  bookings: Booking[];
  canManageStripe: boolean;
  hostStripe: { stripeAccountId: string | null; stripeOnboardingComplete: boolean };
  bnhubV2?: boolean;
}) {
  const [showAddListing, setShowAddListing] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [descAiBusy, setDescAiBusy] = useState(false);
  const quickAddFormRef = useRef<HTMLFormElement>(null);

  async function draftDescriptionWithGemini() {
    const form = quickAddFormRef.current;
    if (!form) return;
    const fd = new FormData(form);
    const title = String(fd.get("title") ?? "").trim();
    const city = String(fd.get("city") ?? "").trim();
    if (!title || !city) {
      window.alert("Add at least a title and city, then try AI draft again.");
      return;
    }
    const nightRaw = String(fd.get("nightPrice") ?? "");
    const night = Number(nightRaw);
    setDescAiBusy(true);
    try {
      const res = await fetch("/api/bnhub/host/listing-description-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          title,
          city,
          country: String(fd.get("country") ?? "").trim() || undefined,
          address: String(fd.get("address") ?? "").trim() || undefined,
          nightPriceCents: Number.isFinite(night) && night > 0 ? Math.round(night * 100) : undefined,
          maxGuests: Number(fd.get("maxGuests")) || undefined,
          beds: Number(fd.get("beds")) || undefined,
          baths: Number(fd.get("baths")) || undefined,
          tone: "warm",
        }),
      });
      const data = (await res.json()) as { description?: string; error?: string };
      if (!res.ok) {
        window.alert(data.error ?? "Could not generate description.");
        return;
      }
      const ta = form.querySelector<HTMLTextAreaElement>('textarea[name="description"]');
      if (ta && data.description) {
        ta.value = data.description;
      }
    } finally {
      setDescAiBusy(false);
    }
  }

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
      <HostVenueModeBar />

      <StripeConnectPanel canManage={canManageStripe} initial={hostStripe} />

      {bnhubV2 ? <HostDashboardV2 ownerId={ownerId} /> : null}

      <ExternalSyncPanel listings={listings} />

      {listings[0] ? (
        <HubAiDock
          hub="bnhub"
          accent="#d4af37"
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
          <h2 className="text-lg font-semibold tracking-tight text-white">Your listings</h2>
          <div className="flex items-center gap-2">
            <Link
              href="/host/listings/new"
              className="lecipm-touch rounded-xl bg-premium-gold px-4 py-2.5 text-sm font-semibold text-black hover:brightness-95"
            >
              Start listing
            </Link>
            <Link
              href="/bnhub/host/listings/new"
              className="lecipm-touch rounded-xl border border-premium-gold/35 px-3 py-2.5 text-xs font-medium text-neutral-200 hover:bg-premium-gold/10"
            >
              Full editor
            </Link>
            <button
              type="button"
              onClick={() => setShowAddListing(!showAddListing)}
              className="lecipm-touch rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-neutral-300 hover:border-premium-gold/25 hover:bg-black/40"
            >
              {showAddListing ? "Cancel" : "+ Quick add"}
            </button>
          </div>
        </div>

        {showAddListing && (
          <form ref={quickAddFormRef} onSubmit={handleAddListing} className="bnhub-panel mb-6 space-y-4 p-6">
            <input name="title" required placeholder="Title" className="bnhub-input w-full" />
            <div className="flex flex-wrap items-end gap-2">
              <textarea name="description" placeholder="Description" rows={4} className="bnhub-input min-h-[100px] flex-1" />
              <button
                type="button"
                onClick={() => void draftDescriptionWithGemini()}
                disabled={descAiBusy}
                className="lecipm-touch shrink-0 rounded-xl border border-premium-gold/40 bg-premium-gold/10 px-3 py-2 text-xs font-semibold text-premium-gold hover:bg-premium-gold/15 disabled:opacity-50"
              >
                {descAiBusy ? "Drafting…" : "AI draft (Gemini)"}
              </button>
            </div>
            <p className="text-[10px] text-neutral-600">
              Uses Google Gemini when <code className="text-neutral-500">GEMINI_API_KEY</code> is set server-side. You remain responsible for accuracy.
            </p>
            <input name="address" required placeholder="Address" className="bnhub-input w-full" />
            <div className="grid grid-cols-2 gap-4">
              <input name="city" required placeholder="City" className="bnhub-input" />
              <input name="country" placeholder="Country" defaultValue="US" className="bnhub-input" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs text-neutral-500">Night price ($)</label>
                <input name="nightPrice" type="number" required min="1" step="0.01" placeholder="100" className="bnhub-input w-full" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-neutral-500">Max guests</label>
                <input name="maxGuests" type="number" min="1" defaultValue="4" className="bnhub-input w-full" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-xs text-neutral-500">Beds</label>
                <input name="beds" type="number" required min="0" className="bnhub-input w-full" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-neutral-500">Baths</label>
                <input name="baths" type="number" required min="0" step="0.5" className="bnhub-input w-full" />
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs text-neutral-500">Photo URLs (comma-separated)</label>
              <input name="photos" placeholder="https://..." className="bnhub-input w-full" />
            </div>
            <button type="submit" className="lecipm-touch rounded-xl bg-premium-gold px-4 py-2 text-sm font-semibold text-black hover:brightness-95">
              Create listing
            </button>
          </form>
        )}

        {addSuccess && <p className="mt-2 text-sm text-premium-gold">Listing added. Refreshing…</p>}

        <ul className="space-y-3">
          {listings.length === 0 && !showAddListing && (
            <li className="bnhub-panel-muted p-6 text-center text-neutral-500">
              <p>No listings yet.</p>
              <Link
                href="/host/listings/new"
                className="mt-3 inline-block text-sm font-semibold text-premium-gold hover:underline"
              >
                Start your first listing →
              </Link>
            </li>
          )}
          {listings.map((l) => (
            <li
              key={l.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-premium-gold/15 bg-black/35 p-4 transition hover:border-premium-gold/30"
            >
              <div>
                <Link href={`/bnhub/${l.id}`} className="font-medium text-neutral-100 hover:text-premium-gold">
                  {l.title}
                </Link>
                <p className="text-sm text-neutral-500">
                  {l.city} · ${(l.nightPriceCents / 100).toFixed(0)}/night
                </p>
                {l.listingCode ? (
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-neutral-500">Code {l.listingCode}</span>
                    <CopyListingCodeButton listingCode={l.listingCode} variant="light" className="!py-1 !px-2" />
                    <span className="text-[10px] text-neutral-600">Support and payout reference</span>
                  </div>
                ) : null}
                <p className="mt-0.5 font-mono text-[10px] text-neutral-600">Internal id {l.id}</p>
                <p className="text-xs text-neutral-600">
                  {l._count.bookings} bookings · {l._count.reviews} reviews
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {l.verificationStatus === "VERIFIED" && (
                  <span className="rounded-full border border-premium-gold/35 bg-premium-gold/10 px-2.5 py-1 text-xs font-medium text-premium-gold">
                    Verified
                  </span>
                )}
                <Link
                  href={`/bnhub/host/listings/${l.id}/edit`}
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:border-premium-gold/25 hover:bg-black/40"
                >
                  Edit
                </Link>
                <Link
                  href={`/bnhub/host/listings/${l.id}/availability`}
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:border-premium-gold/25 hover:bg-black/40"
                >
                  Calendar
                </Link>
                <Link
                  href="/bnhub/host/channel-manager"
                  className="rounded-lg border border-premium-gold/25 px-3 py-1.5 text-xs font-medium text-premium-gold/90 hover:bg-premium-gold/10"
                >
                  Channels
                </Link>
                <Link
                  href={`/dashboard/listings/${l.id}`}
                  className="rounded-lg bg-premium-gold/15 px-3 py-1.5 text-xs font-medium text-premium-gold hover:bg-premium-gold/20"
                >
                  AI + Poster
                </Link>
                <Link
                  href={`/tools/design-studio?listingId=${encodeURIComponent(l.id)}`}
                  className="rounded-lg border border-premium-gold/30 px-3 py-1.5 text-xs font-medium text-premium-gold/90 hover:bg-premium-gold/10"
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
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-white">Bookings</h2>
        <ul className="space-y-3">
          {bookings.length === 0 && (
            <li className="bnhub-panel-muted p-6 text-center text-neutral-500">No bookings yet.</li>
          )}
          {bookings.map((b) => {
            const paymentSummary = getHostPaymentSummary(b);
            return (
            <li
              key={b.id}
              className="bnhub-panel-muted p-4 transition hover:border-premium-gold/20"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-neutral-100">{b.listing.title}</p>
                  <p className="text-sm text-neutral-400">
                    {new Date(b.checkIn).toLocaleDateString()} – {new Date(b.checkOut).toLocaleDateString()} · {b.nights}{" "}
                    nights
                  </p>
                  <p className="text-sm text-neutral-400">
                    Guest: <span className="text-neutral-200">{b.guest.name ?? "—"}</span> · {b.guest.email}
                  </p>
                </div>
                <div className="text-right text-xs">
                  <p className="text-neutral-500">
                    Booking: <span className="capitalize text-neutral-200">{b.status.toLowerCase().replace(/_/g, " ")}</span>
                  </p>
                  <p className="mt-0.5 text-neutral-500">
                    Payment: <span className={paymentSummary.tone}>{paymentSummary.label}</span>
                    {b.payment?.status === "COMPLETED" && b.payment.hostPayoutCents != null ? (
                      <span className="ml-1 text-premium-gold/90">
                        · Est. payout ${((b.payment.hostPayoutCents ?? 0) / 100).toFixed(0)}
                      </span>
                    ) : null}
                  </p>
                </div>
              </div>
              <SpecialRequestsBlock booking={b} />
              {(b.bnhubReservationPayment || b.payment) && (
                <div className="mt-3 grid gap-2 rounded-lg border border-premium-gold/15 bg-black/45 p-3 text-xs text-neutral-400 sm:grid-cols-2">
                  {b.bnhubReservationPayment?.amountCapturedCents != null ? (
                    <p>
                      Guest charged:{" "}
                      <span className="font-mono font-medium text-neutral-100">
                        ${(b.bnhubReservationPayment.amountCapturedCents / 100).toFixed(2)}
                      </span>
                    </p>
                  ) : null}
                  {b.payment?.platformFeeCents != null ? (
                    <p>
                      Platform fee:{" "}
                      <span className="font-mono font-medium text-neutral-100">
                        ${(b.payment.platformFeeCents / 100).toFixed(2)}
                      </span>
                    </p>
                  ) : null}
                  {b.payment?.scheduledHostPayoutAt ? (
                    <p>
                      Scheduled payout:{" "}
                      <span className="font-medium text-neutral-100">
                        {new Date(b.payment.scheduledHostPayoutAt).toLocaleDateString()}
                      </span>
                    </p>
                  ) : null}
                  {b.payment?.payoutHoldReason ? (
                    <p>
                      Payout hold:{" "}
                      <span className="font-medium capitalize text-premium-gold">
                        {b.payment.payoutHoldReason.replace(/_/g, " ")}
                      </span>
                    </p>
                  ) : null}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  href={`/bnhub/booking/${b.id}`}
                  className="rounded-lg border border-premium-gold/35 bg-premium-gold/10 px-3 py-1.5 text-xs font-medium text-premium-gold hover:bg-premium-gold/15"
                >
                  View booking
                </Link>
                {b.payment?.stripeReceiptUrl ? (
                  <a
                    href={b.payment.stripeReceiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:border-premium-gold/25 hover:bg-black/40"
                  >
                    Receipt
                  </a>
                ) : null}
              </div>
            </li>
            );
          })}
        </ul>
      </section>

      {/* Tools grid */}
      <section>
        <h2 className="mb-4 text-lg font-semibold tracking-tight text-white">Tools and insights</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <PricingWidget listings={listings} />
          <HostAiInsights listings={listings} />
          <ReferralWidget ownerId={ownerId} />
        </div>
      </section>

      {/* Footer links */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-premium-gold/15 pt-6">
        <div className="flex flex-wrap gap-4">
          <Link href="/messages" className="text-sm font-medium text-premium-gold hover:underline">
            Messages
          </Link>
          <Link href="/bnhub/host/incident" className="text-sm font-medium text-neutral-400 hover:text-neutral-200">
            Report incident
          </Link>
          <Link href="/bnhub/stays" className="text-sm font-medium text-neutral-400 hover:text-neutral-200">
            Find a stay
          </Link>
        </div>
        <p className="text-xs text-neutral-500">Guest payments run on Stripe; payouts follow your Connect status above.</p>
      </div>
    </div>
  );
}
