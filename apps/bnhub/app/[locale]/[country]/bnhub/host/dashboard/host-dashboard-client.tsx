"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { CopyListingCodeButton } from "@/components/bnhub/CopyListingCodeButton";
import { HubAiDock } from "@/components/ai/HubAiDock";
import { HostVenueModeBar } from "@/components/bnhub/HostVenueModeBar";
import { HostDashboardV2 } from "@/components/bnhub-host/HostDashboardV2";
import { EmptyState } from "@/components/ui/EmptyState";
import { Building2, CalendarDays, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/SkeletonLoader";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/ToastProvider";

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
  const { showToast } = useToast();
  const [states, setStates] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(listings.map((l) => [l.id, Boolean(l.externalSyncEnabled)]))
  );
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    setStates(Object.fromEntries(listings.map((l) => [l.id, Boolean(l.externalSyncEnabled)])));
  }, [listings]);

  if (listings.length === 0) return null;

  async function toggle(listingId: string, value: boolean) {
    setSaving(listingId);
    try {
      const res = await fetch("/api/bnhub/host/external-sync", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ listingId, externalSyncEnabled: value }),
      });
      if (!res.ok) throw new Error("save_failed");
      setStates((s) => ({ ...s, [listingId]: value }));
      showToast("External sync updated", "success");
    } catch {
      showToast("Could not update sync settings", "error");
    } finally {
      setSaving(null);
    }
  }

  return (
    <section className="bnhub-card-polish bnhub-panel-muted p-8 border-premium-gold/10">
      <div className="flex flex-wrap items-center justify-between gap-6 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-xl font-black tracking-tighter text-white uppercase italic">Distribution Control</h2>
          <p className="mt-2 text-xs text-neutral-500 max-w-lg">
            Multichannel inventory synchronization. Enable real-time availability updates for Airbnb, Booking.com, and VRBO via global iCal/Webhook bridge.
          </p>
        </div>
      </div>
      <ul className="mt-6 divide-y divide-white/5">
        {listings.map((l) => (
          <li key={l.id} className="flex flex-wrap items-center justify-between gap-4 py-4 first:pt-0">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-2 w-2 rounded-full",
                states[l.id] ? "bg-premium-gold animate-pulse shadow-[0_0_8px_rgba(212,175,55,0.4)]" : "bg-neutral-800"
              )} />
              <div>
                <p className="text-sm font-bold text-neutral-100">{l.title}</p>
                <p className="text-[10px] uppercase tracking-widest text-neutral-500">{l.city}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-600">Sync Status</span>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={states[l.id] ?? false}
                  disabled={saving === l.id}
                  onChange={(e) => void toggle(l.id, e.target.checked)}
                />
                <div className="peer h-6 w-11 rounded-full bg-neutral-800 transition-all after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-premium-gold peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-premium-gold/20 disabled:opacity-50"></div>
              </label>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/5 pt-6">
        <Link
          href="/bnhub/host/channel-manager"
          className="bnhub-touch-feedback inline-flex items-center gap-2 rounded-xl border border-premium-gold/30 bg-premium-gold/5 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-premium-gold hover:bg-premium-gold/10"
        >
          Configure Bridges
        </Link>
        <p className="max-w-md text-[10px] leading-relaxed text-neutral-600 italic">
          Availability pushed via <code className="text-neutral-500">/api/integrations/webhook</code>. Sync conflicts logged in the audit trail.
        </p>
      </div>
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
    <div className="bnhub-card-polish bnhub-panel-muted p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold tracking-tight text-white uppercase italic">Pricing Insight</h3>
        <span className="rounded-full bg-premium-gold/10 px-2 py-0.5 text-[10px] font-bold text-premium-gold border border-premium-gold/20">AI</span>
      </div>
      <div className="mt-4">
        <select
          value={listingId}
          onChange={(e) => setListingId(e.target.value)}
          className="bnhub-input w-full bg-black/40 text-sm font-medium"
        >
          {listings.map((l) => (
            <option key={l.id} value={l.id}>{l.title}</option>
          ))}
        </select>
      </div>
      
      <div className="mt-5 space-y-4">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ) : rec ? (
          <div className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">${(rec.recommendedPriceCents / 100).toFixed(0)}</span>
              <span className="text-xs font-bold uppercase tracking-widest text-premium-gold">Suggested</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              <div>Current: <span className="text-neutral-300">${(rec.currentPriceCents / 100).toFixed(0)}</span></div>
              <div>Market: <span className="text-neutral-300">${(rec.marketAvgCents / 100).toFixed(0)}</span></div>
            </div>
            <ul className="mt-3 space-y-1.5">
              {rec.factors.slice(0, 3).map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-neutral-400">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-premium-gold"></span>
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {loadingInsight ? (
          <div className="border-t border-white/5 pt-4 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
          </div>
        ) : hostInsight && hostInsight.hostBullets.length > 0 ? (
          <div className="border-t border-white/5 pt-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">Market Comparison</p>
            <ul className="space-y-2">
              {hostInsight.hostBullets.map((b, i) => (
                <li key={i} className="text-xs leading-relaxed text-neutral-300 italic">
                  "{b}"
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
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
    <div className="bnhub-card-polish bnhub-panel-muted p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold tracking-tight text-white uppercase italic">Growth Strategy</h3>
        <span className="rounded-full bg-premium-gold/10 px-2 py-0.5 text-[10px] font-bold text-premium-gold border border-premium-gold/20">AI</span>
      </div>
      <div className="mt-4">
        <select
          value={listingId}
          onChange={(e) => setListingId(e.target.value)}
          className="bnhub-input w-full bg-black/40 text-sm font-medium"
        >
          {listings.map((l) => (
            <option key={l.id} value={l.id}>{l.title}</option>
          ))}
        </select>
      </div>

      <div className="mt-5 space-y-4">
        {loadingRecs ? (
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        ) : recs.length > 0 ? (
          <div className="space-y-3">
            {recs.slice(0, 3).map((r, i) => (
              <div key={i} className="rounded-lg border border-white/5 bg-white/5 p-3">
                <p className="text-xs font-bold text-neutral-200">{r.title}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-neutral-500">{r.description}</p>
              </div>
            ))}
          </div>
        ) : null}

        {loadingDemand ? (
          <div className="border-t border-white/5 pt-4 space-y-2">
            <Skeleton className="h-3 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : demand ? (
          <div className="border-t border-white/5 pt-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">Market Demand</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-white capitalize">{demand.demandLevel}</span>
              <span className="h-2 w-2 rounded-full bg-premium-gold"></span>
              <span className="text-xs text-neutral-400">{city}</span>
            </div>
            {demand.highDemandDates.length > 0 && (
              <p className="mt-2 text-[10px] text-neutral-500 italic">
                Surge expected: {demand.highDemandDates.slice(0, 2).join(", ")}
              </p>
            )}
          </div>
        ) : null}
      </div>
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
    <div className="bnhub-card-polish bnhub-panel-muted p-5 flex flex-col justify-between">
      <div>
        <h3 className="text-base font-bold tracking-tight text-white uppercase italic">Ambassador</h3>
        <p className="mt-2 text-xs leading-relaxed text-neutral-500">
          Grow the BNHub community. Invite fellow hosts and earn booking credits for every successful onboarding.
        </p>
      </div>

      <div className="mt-6">
        {code ? (
          <div className="rounded-xl border border-premium-gold/30 bg-premium-gold/5 p-4 text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-premium-gold/70 mb-1">Your Referral Code</p>
            <p className="font-mono text-xl font-black tracking-tighter text-premium-gold">{code}</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={generateCode}
            disabled={loading}
            className="bnhub-touch-feedback flex w-full items-center justify-center rounded-xl bg-premium-gold px-4 py-3 text-sm font-black uppercase tracking-widest text-black disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate Invite Link"}
          </button>
        )}
      </div>
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
  const { showToast } = useToast();
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
      showToast("Add at least a title and city", "warning");
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
        showToast(data.error ?? "AI draft failed", "error");
        return;
      }
      const ta = form.querySelector<HTMLTextAreaElement>('textarea[name="description"]');
      if (ta && data.description) {
        ta.value = data.description;
        showToast("Description generated", "success");
      }
    } finally {
      setDescAiBusy(false);
    }
  }

  async function handleAddListing(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    try {
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
        showToast("Listing created successfully", "success");
        setAddSuccess(true);
        form.reset();
        setShowAddListing(false);
        setTimeout(() => window.location.reload(), 1500);
      } else {
        showToast("Failed to create listing", "error");
      }
    } catch {
      showToast("Error creating listing", "error");
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
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-white/5 pb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-premium-gold/80">Properties</p>
            <h2 className="mt-1 text-2xl font-black tracking-tighter text-white italic">Portfolio Management</h2>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/bnhub/host/listings/new"
              className="bnhub-touch-feedback rounded-xl border border-premium-gold/30 bg-premium-gold/5 px-5 py-2.5 text-xs font-black uppercase tracking-widest text-premium-gold hover:bg-premium-gold/10"
            >
              Advanced Editor
            </Link>
            <button
              type="button"
              onClick={() => setShowAddListing(!showAddListing)}
              className="bnhub-touch-feedback rounded-xl bg-premium-gold px-6 py-2.5 text-xs font-black uppercase tracking-widest text-black shadow-lg shadow-premium-gold/20"
            >
              {showAddListing ? "Cancel" : "Quick Add"}
            </button>
          </div>
        </div>

        {showAddListing && (
          <form ref={quickAddFormRef} onSubmit={handleAddListing} className="bnhub-panel-muted mb-8 space-y-6 p-8 border-premium-gold/20 bg-black/60 backdrop-blur-xl">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Listing Identity</label>
              <input name="title" required placeholder="Luxury Penthouse with Skyline View" className="bnhub-input w-full text-lg font-bold" />
            </div>
            
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Narrative</label>
                <button
                  type="button"
                  onClick={() => void draftDescriptionWithGemini()}
                  disabled={descAiBusy}
                  className="bnhub-touch-feedback text-[10px] font-black uppercase tracking-widest text-premium-gold"
                >
                  {descAiBusy ? "Drafting..." : "Generate AI Description"}
                </button>
              </div>
              <textarea name="description" placeholder="Describe the unique value of this stay..." rows={4} className="bnhub-input min-h-[120px] w-full text-sm leading-relaxed" />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Location</label>
                <input name="address" required placeholder="123 Prestige Ave" className="bnhub-input w-full" />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-5">
                <input name="city" required placeholder="City" className="bnhub-input" />
                <input name="country" placeholder="Country" defaultValue="US" className="bnhub-input" />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Price per Night ($)</label>
                <input name="nightPrice" type="number" required min="1" step="0.01" placeholder="450.00" className="bnhub-input w-full font-mono text-premium-gold" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Max Guests</label>
                <input name="maxGuests" type="number" min="1" defaultValue="4" className="bnhub-input w-full" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Beds</label>
                  <input name="beds" type="number" required min="0" className="bnhub-input w-full" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Baths</label>
                  <input name="baths" type="number" required min="0" step="0.5" className="bnhub-input w-full" />
                </div>
              </div>
            </div>

            <button type="submit" className="bnhub-touch-feedback w-full rounded-xl bg-premium-gold py-4 text-sm font-black uppercase tracking-[0.2em] text-black shadow-xl shadow-premium-gold/20">
              Publish Listing
            </button>
          </form>
        )}

        <ul className="space-y-3">
          {listings.length === 0 && !showAddListing && (
            <EmptyState
              icon={Building2}
              title="No listings yet"
              description="Start your first listing to begin hosting on BNHub."
              ctaText="Start your first listing"
              ctaHref="/host/listings/new"
            />
          )}
          {listings.map((l) => (
            <li
              key={l.id}
              className="bnhub-card-polish flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-premium-gold/15 bg-black/35 p-4"
            >
              <div className="flex flex-1 items-start gap-4">
                <div className="hidden h-16 w-16 overflow-hidden rounded-xl bg-neutral-900 sm:block">
                  {/* Image placeholder if none exists, listing title initial as fallback */}
                  <div className="flex h-full w-full items-center justify-center text-xl font-bold text-premium-gold/40">
                    {l.title[0]}
                  </div>
                </div>
                <div>
                  <Link href={`/bnhub/${l.id}`} className="text-lg font-semibold tracking-tight text-neutral-100 hover:text-premium-gold">
                    {l.title}
                  </Link>
                  <p className="text-sm text-neutral-400">
                    {l.city} · <span className="font-semibold text-premium-gold">${(l.nightPriceCents / 100).toFixed(0)}</span><span className="text-[10px] text-neutral-600">/night</span>
                  </p>
                  {l.listingCode ? (
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <span className="rounded bg-neutral-900 px-1.5 py-0.5 font-mono text-[10px] font-bold text-premium-gold/80">Code {l.listingCode}</span>
                      <CopyListingCodeButton listingCode={l.listingCode} variant="light" className="!py-0.5 !px-1.5 !text-[10px]" />
                    </div>
                  ) : null}
                  <div className="mt-2 flex items-center gap-3 text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                    <span>{l._count.bookings} bookings</span>
                    <span className="h-1 w-1 rounded-full bg-neutral-700"></span>
                    <span>{l._count.reviews} reviews</span>
                  </div>
                </div>
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
      <section className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-white/5 pb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-premium-gold/80">Reservations</p>
            <h2 className="mt-1 text-2xl font-black tracking-tighter text-white italic">Booking Lifecycle</h2>
          </div>
        </div>
        <ul className="space-y-3">
          {bookings.length === 0 && (
            <EmptyState
              icon={CalendarDays}
              title="No bookings yet"
              description="Your future bookings will appear here once guests start reserving your stays."
            />
          )}
          {bookings.map((b) => {
            const paymentSummary = getHostPaymentSummary(b);
            const isUpcoming = new Date(b.checkIn).getTime() - Date.now() < 48 * 60 * 60 * 1000 && new Date(b.checkIn).getTime() > Date.now();
            const isHighValue = (b.payment?.hostPayoutCents ?? 0) > 100000; // > $1000

            return (
            <li
              key={b.id}
              className={cn(
                "bnhub-card-polish p-4 rounded-2xl border",
                isUpcoming || isHighValue ? "bnhub-priority-border" : "bnhub-panel-muted"
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold tracking-tight text-neutral-100">{b.listing.title}</p>
                    {isUpcoming && (
                      <span className="animate-pulse rounded-full bg-premium-gold/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-premium-gold">
                        Upcoming
                      </span>
                    )}
                    {isHighValue && (
                      <span className="rounded-full bg-premium-gold px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-black">
                        High Value
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-medium text-neutral-300">
                    {new Date(b.checkIn).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – {new Date(b.checkOut).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · <span className="text-premium-gold">{b.nights} nights</span>
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    Guest: <span className="font-semibold text-neutral-200">{b.guest.name ?? b.guest.email.split('@')[0]}</span>
                  </p>
                </div>
                <div className="text-right">
                  <div className="inline-block rounded-md bg-neutral-900/50 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-neutral-500 border border-white/5">
                    {b.status.replace(/_/g, " ")}
                  </div>
                  <p className="mt-2 text-xs font-medium">
                    <span className={paymentSummary.tone}>{paymentSummary.label}</span>
                    {b.payment?.hostPayoutCents != null && (
                      <span className="ml-1.5 font-mono text-premium-gold">
                        ${(b.payment.hostPayoutCents / 100).toFixed(0)}
                      </span>
                    )}
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
