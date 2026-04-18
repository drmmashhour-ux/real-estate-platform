"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield } from "lucide-react";
import { BnhubStripeTrustHint } from "@/components/bnhub/BnhubStripeTrustHint";
import { BnhubPriceMayIncreaseHint } from "@/components/bnhub/BnhubPriceMayIncreaseHint";
import { BnhubTrustSignals } from "@/components/bnhub/BnhubTrustSignals";
import { HintTooltip } from "@/components/ui/HintTooltip";
import { CTA_PRIMARY_FULL_WIDTH } from "@/lib/ui/cta-classes";
import { earlyBookingHintForLeadDays, nightsUntilCheckInUtc } from "@/lib/bnhub/early-booking";
import { INSURANCE_LEAD_CONSENT_LABEL } from "@/lib/insurance/consent-text";
import { resolveAiBookingInsightLines } from "@/lib/bnhub/bnhub-booking-insight";
import type { BnhubMarketInsightPayload } from "@/lib/bnhub/market-price-insight";
import { ProductAnalyticsEvents, reportProductEvent } from "@/lib/analytics/product-analytics";
import { track, TrackingEvent } from "@/lib/tracking";
import { LISTING_EXPLORE_NO_PAYMENT_LINE } from "@/lib/listings/listing-ad-trust-copy";
import { buildBnhubAuthContinueUrl } from "@/lib/bnhub/bnhub-auth-continue-url";
import { trackBookingStarted } from "@/modules/bnhub/conversion/bnhub-guest-conversion-tracker";

function formatMoneyCents(cents: number) {
  const n = cents / 100;
  const formatted =
    Math.abs(n % 1) < 1e-9
      ? n.toLocaleString()
      : n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `$${formatted}`;
}

function formatHostResponseMinutes(minutes: number | null | undefined): string | null {
  if (minutes == null || !Number.isFinite(minutes) || minutes <= 0) return null;
  if (minutes < 60) {
    const m = Math.max(1, Math.round(minutes));
    return `Typically responds within ${m} min`;
  }
  const hours = minutes / 60;
  if (hours < 24) {
    const h = hours < 10 ? Math.round(hours * 10) / 10 : Math.round(hours);
    return `Typically responds within ${h} hour${h === 1 ? "" : "s"}`;
  }
  const days = Math.round(hours / 24);
  return `Typically responds within ${days} day${days === 1 ? "" : "s"}`;
}

type PricingBreakdown = {
  nightlyBreakdown: { date: string; cents: number }[];
  subtotalCents: number;
  earlyBookingDiscountCents?: number;
  earlyBookingLabel?: string | null;
  lodgingDiscountAppliedCents?: number;
  lodgingDiscountSource?: "NONE" | "EARLY_BOOKING" | "LOYALTY";
  loyaltyDiscountLabel?: string | null;
  loyaltyDiscountPercentOffered?: number;
  lodgingSubtotalAfterDiscountCents?: number;
  cleaningFeeCents: number;
  gstCents?: number;
  qstCents?: number;
  taxCents: number;
  serviceFeeCents: number;
  totalCents: number;
  nights: number;
  currency: string;
};

type PetType = "dog" | "cat" | "other";

export function BookingForm({
  listingId,
  nightPriceCents,
  cleaningFeeCents = 0,
  instantBookEnabled = false,
  guestId,
  houseRules,
  cancellationPolicy,
  hostPayoutReady = true,
  petsAllowed = null,
  maxPetWeightKg = null,
  maxGuests = 4,
  listingVerified = false,
  stripeConfigured = false,
  loyaltyTierBadge = null,
  hostAvgRating = null,
  hostReviewCount = 0,
  hostResponseMinutes = null,
  hostIsSuperHost = false,
  priceInsightLine = "Not enough comparable stays in this area on BNHUB to benchmark — use photos, reviews, and amenities to decide.",
  listingSoftDemandLine = null,
  bookingInsightMarket = null,
  listingStaySlug,
  initialCheckIn = "",
  initialCheckOut = "",
  initialGuestCount,
}: {
  listingId: string;
  /** Listing code or id — used in post-login return URL for request-to-book */
  listingStaySlug: string;
  /** Prefill dates after sign-in (query params from server) */
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuestCount?: number;
  nightPriceCents: number;
  cleaningFeeCents?: number;
  instantBookEnabled?: boolean;
  guestId: string | null;
  houseRules?: string | null;
  cancellationPolicy?: string | null;
  /** False when host has not finished Stripe Connect — bookings are blocked for paid checkout. */
  hostPayoutReady?: boolean;
  /** Listing pet policy — used for guest warnings only. */
  petsAllowed?: boolean | null;
  maxPetWeightKg?: number | null;
  maxGuests?: number;
  listingVerified?: boolean;
  /** When true, unpaid flow can open Stripe Checkout after create. */
  stripeConfigured?: boolean;
  /** BNHUB Rewards tier label for signed-in guests (e.g. Silver · up to 5% off lodging). */
  loyaltyTierBadge?: string | null;
  /** Listing review average (0–5), if any. */
  hostAvgRating?: number | null;
  hostReviewCount?: number;
  /** From HostQuality.avgResponseMinutes when available. */
  hostResponseMinutes?: number | null;
  hostIsSuperHost?: boolean;
  /** Factual one-liner from BNHUB market peer data (see `bnhubBookingPriceInsightDecisionLine`). */
  priceInsightLine?: string;
  /** Optional BNHUB activity hint from server (see `resolveSoftDemandLineFromInsight`). */
  listingSoftDemandLine?: string | null;
  /** Marketplace fields for AI booking copy (see `resolveAiBookingInsightLines`). */
  bookingInsightMarket?: Pick<
    BnhubMarketInsightPayload,
    "demandLevel" | "peerListingCount" | "yourNightCents" | "recommendedNightCents"
  > | null;
}) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState(initialCheckIn);
  const [checkOut, setCheckOut] = useState(initialCheckOut);
  const [notes, setNotes] = useState("");
  const [svcAirportPickup, setSvcAirportPickup] = useState(false);
  const [svcParking, setSvcParking] = useState(false);
  const [svcShuttle, setSvcShuttle] = useState(false);
  const [extraServicesText, setExtraServicesText] = useState("");
  const [travelingWithPet, setTravelingWithPet] = useState(false);
  const [guestPetType, setGuestPetType] = useState<PetType>("dog");
  const [guestPetWeightKg, setGuestPetWeightKg] = useState("");
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [breakdown, setBreakdown] = useState<PricingBreakdown | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteSoftDemandLine, setQuoteSoftDemandLine] = useState<string | null>(null);
  const [guestCount, setGuestCount] = useState(() =>
    initialGuestCount != null && Number.isFinite(initialGuestCount)
      ? Math.min(maxGuests, Math.max(1, Math.floor(initialGuestCount)))
      : Math.min(2, Math.max(1, maxGuests))
  );
  const [insuranceEmail, setInsuranceEmail] = useState("");
  const [insuranceConsent, setInsuranceConsent] = useState(false);
  const [insuranceBusy, setInsuranceBusy] = useState(false);
  const [insuranceFeedback, setInsuranceFeedback] = useState<string | null>(null);
  const hasRulesToConfirm = Boolean(houseRules || cancellationPolicy);

  const nights =
    checkIn && checkOut
      ? Math.ceil(
          (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

  const leadDays = checkIn ? nightsUntilCheckInUtc(checkIn) : null;
  const earlyHint = earlyBookingHintForLeadDays(leadDays);

  useEffect(() => {
    if (!listingId || !checkIn || !checkOut || nights < 1) {
      setBreakdown(null);
      setQuoteLoading(false);
      setQuoteSoftDemandLine(null);
      return;
    }
    const ctrl = new AbortController();
    setQuoteLoading(true);
    setQuoteSoftDemandLine(null);
    fetch("/api/bookings/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      signal: ctrl.signal,
      body: JSON.stringify({
        listingId,
        checkIn,
        checkOut,
        guestsCount: Math.min(maxGuests, Math.max(1, guestCount)),
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          if (res.status === 409 || j.error?.toLowerCase().includes("available")) {
            setError("Selected dates are unavailable.");
          } else {
            setError("");
          }
          return null;
        }
        return res.json() as Promise<{
          nights: number;
          grossSubtotalCents?: number;
          baseAmount?: number;
          cleaningFee?: number;
          serviceFee?: number;
          taxesAmount?: number;
          totalAmount?: number;
          currency?: string;
          breakdown?: {
            lodgingDiscountAppliedCents?: number;
            lodgingDiscountSource?: "NONE" | "EARLY_BOOKING" | "LOYALTY";
            loyaltyDiscountLabel?: string | null;
            loyaltyDiscountPercentOffered?: number;
            earlyBookingDiscountCents?: number;
            earlyBookingLabel?: string | null;
            lodgingSubtotalAfterDiscountCents?: number;
          };
          softDemandLine?: string | null;
        }>;
      })
      .then((q) => {
        setQuoteLoading(false);
        if (!q) {
          setBreakdown(null);
          setQuoteSoftDemandLine(null);
          return;
        }
        setQuoteSoftDemandLine(
          typeof q.softDemandLine === "string" && q.softDemandLine.trim()
            ? q.softDemandLine.trim()
            : null
        );
        setError("");
        const toCents = (n: number) => Math.round(n * 100);
        const br = q.breakdown;
        const gross = typeof q.grossSubtotalCents === "number" ? q.grossSubtotalCents : toCents(q.baseAmount ?? 0);
        const applied =
          br?.lodgingDiscountAppliedCents ??
          Math.max(br?.earlyBookingDiscountCents ?? 0, 0);
        setBreakdown({
          nightlyBreakdown: [],
          subtotalCents: gross,
          earlyBookingDiscountCents: br?.earlyBookingDiscountCents ?? 0,
          earlyBookingLabel: br?.earlyBookingLabel ?? null,
          lodgingDiscountAppliedCents: applied,
          lodgingDiscountSource: br?.lodgingDiscountSource ?? "NONE",
          loyaltyDiscountLabel: br?.loyaltyDiscountLabel ?? null,
          loyaltyDiscountPercentOffered: br?.loyaltyDiscountPercentOffered ?? 0,
          lodgingSubtotalAfterDiscountCents: br?.lodgingSubtotalAfterDiscountCents ?? toCents(q.baseAmount ?? 0),
          cleaningFeeCents: toCents(q.cleaningFee ?? 0),
          gstCents: undefined,
          qstCents: undefined,
          taxCents: toCents(q.taxesAmount ?? 0),
          serviceFeeCents: toCents(q.serviceFee ?? 0),
          totalCents: toCents(q.totalAmount ?? 0),
          nights: q.nights,
          currency: (q.currency ?? "CAD").toUpperCase(),
        });
      })
      .catch(() => {
        setQuoteLoading(false);
        setBreakdown(null);
        setQuoteSoftDemandLine(null);
      });
    return () => ctrl.abort();
  }, [listingId, checkIn, checkOut, nights, guestCount, maxGuests]);

  const displayBreakdown = breakdown ?? {
    subtotalCents: nights * nightPriceCents,
    earlyBookingDiscountCents: 0,
    earlyBookingLabel: null,
    lodgingDiscountAppliedCents: 0,
    lodgingDiscountSource: "NONE" as const,
    loyaltyDiscountLabel: null,
    loyaltyDiscountPercentOffered: 0,
    lodgingSubtotalAfterDiscountCents: nights * nightPriceCents,
    cleaningFeeCents,
    taxCents: 0,
    serviceFeeCents: Math.round((nights * nightPriceCents * 12) / 100),
    totalCents: nights * nightPriceCents + Math.round((nights * nightPriceCents * 12) / 100) + cleaningFeeCents,
    nights,
    currency: "CAD",
    nightlyBreakdown: [],
  };

  const hasLiveQuote = breakdown !== null;
  const bdCurrency = displayBreakdown.currency ?? "CAD";
  const responseLabel = formatHostResponseMinutes(hostResponseMinutes);
  const showHostCredibility =
    (hostAvgRating != null && hostAvgRating > 0) ||
    hostReviewCount > 0 ||
    responseLabel != null ||
    hostIsSuperHost;

  const softDemandMerged =
    (nights > 0 ? quoteSoftDemandLine : null) ?? listingSoftDemandLine ?? null;

  async function submitInsuranceQuoteRequest() {
    setInsuranceFeedback(null);
    if (!guestId) {
      setInsuranceFeedback("Sign in to request an insurance quote.");
      return;
    }
    const email = insuranceEmail.trim().toLowerCase();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!ok) {
      setInsuranceFeedback("Enter a valid email.");
      return;
    }
    if (!insuranceConsent) {
      setInsuranceFeedback("Consent is required.");
      return;
    }
    setInsuranceBusy(true);
    try {
      const r = await fetch("/api/insurance/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          consentGiven: true,
          email,
          leadType: "travel",
          source: "bnbhub",
          listingId,
          message: `Travel / stay insurance quote request for BNHUB listing ${listingId}.`,
        }),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : "Request failed");
      setInsuranceFeedback("Request sent — a broker partner may follow up. Not a bound policy until underwriting.");
      setInsuranceConsent(false);
    } catch (err) {
      setInsuranceFeedback(err instanceof Error ? err.message : "Request failed");
    } finally {
      setInsuranceBusy(false);
    }
  }

  const aiBookingLines = useMemo(() => {
    if (!bookingInsightMarket) return [];
    const lead = checkIn ? nightsUntilCheckInUtc(checkIn) : null;
    const tight =
      typeof quoteSoftDemandLine === "string" &&
      quoteSoftDemandLine.includes("Limited availability");
    return resolveAiBookingInsightLines({
      demandLevel: bookingInsightMarket.demandLevel,
      peerListingCount: bookingInsightMarket.peerListingCount,
      yourNightCents: bookingInsightMarket.yourNightCents,
      recommendedNightCents: bookingInsightMarket.recommendedNightCents,
      hasSelectedDates: nights > 0,
      leadDaysUntilCheckIn: lead,
      calendarTightForDates: tight,
    });
  }, [bookingInsightMarket, checkIn, nights, quoteSoftDemandLine]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!guestId) {
      if (!checkIn || !checkOut || nights < 1) {
        setError("Please select check-in and check-out dates.");
        return;
      }
      if (hasRulesToConfirm && !agreedToRules) {
        setError("Please confirm you agree to the house rules and cancellation policy.");
        return;
      }
      if (!hostPayoutReady) {
        setError("This host is not ready to accept payments yet. Try again later or contact the host.");
        return;
      }
      const next = buildBnhubAuthContinueUrl({
        listingId,
        listingStaySlug,
        checkIn,
        checkOut,
        guestCount,
        maxGuests,
        instantBookEnabled,
        stripeConfigured,
        hostPayoutReady,
      });
      window.location.assign(`/bnhub/login?next=${encodeURIComponent(next)}`);
      return;
    }
    if (!checkIn || !checkOut || nights < 1) {
      setError("Please select check-in and check-out dates.");
      return;
    }
    if (hasRulesToConfirm && !agreedToRules) {
      setError("Please confirm you agree to the house rules and cancellation policy.");
      return;
    }
    if (!hostPayoutReady) {
      setError("This host is not ready to accept payments yet. Try again later or contact the host.");
      return;
    }
    setLoading(true);
    try {
      track(TrackingEvent.BOOKING_CLICK, { meta: { listingId, source: "bnhub_booking_form" } });
      const weightNum = guestPetWeightKg.trim() ? Number(guestPetWeightKg) : NaN;
      const specialRequestsJson: Record<string, unknown> = {
        services: {
          airportPickup: svcAirportPickup,
          parking: svcParking,
          shuttle: svcShuttle,
        },
        ...(extraServicesText.trim() ? { extraServices: extraServicesText.trim() } : {}),
        ...(travelingWithPet
          ? {
              guestPet: {
                travelingWithPet: true,
                type: guestPetType,
                weightKg: Number.isFinite(weightNum) ? weightNum : null,
              },
            }
          : {}),
      };
      const hasStructured =
        svcAirportPickup ||
        svcParking ||
        svcShuttle ||
        extraServicesText.trim().length > 0 ||
        travelingWithPet;

      const res = await fetch("/api/bookings/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          checkIn,
          checkOut,
          guestsCount: Math.min(maxGuests, Math.max(1, guestCount)),
          guestNotes: notes.trim() || undefined,
          specialRequest: notes.trim() || undefined,
          ...(hasStructured ? { specialRequestsJson } : {}),
        }),
      });
      const data = (await res.json()) as {
        id?: string;
        error?: string;
        summary?: { status?: string; totalCents?: number | null };
      };
      if (!res.ok) {
        setError(
          typeof data.error === "string" && data.error.trim()
            ? data.error
            : "Something went wrong — please try again."
        );
        return;
      }
      const bookingId = data.id;
      if (!bookingId) {
        setError("Something went wrong — please try again.");
        return;
      }

      reportProductEvent(ProductAnalyticsEvents.BOOKING_STARTED, {
        booking_id: bookingId,
        listing_id: listingId,
        source: "bnhub_booking_form",
      });
      trackBookingStarted(listingId);

      if (data.summary?.status === "PENDING" && stripeConfigured && hostPayoutReady) {
        const ck = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentType: "booking",
            bookingId,
          }),
        });
        const ckData = (await ck.json()) as { url?: string; error?: string };
        if (!ck.ok) {
          setError(
            typeof ckData.error === "string" && ckData.error.trim()
              ? ckData.error
              : "Could not start checkout."
          );
          router.push(`/bnhub/booking/${bookingId}`);
          return;
        }
        if (ckData.url) {
          window.location.href = ckData.url;
          return;
        }
      }

      router.push(`/bnhub/booking/${bookingId}`);
    } catch {
      setError("Something went wrong — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form id="bnhub-booking-form" onSubmit={handleSubmit} className="mt-6 space-y-4">
      <p className="rounded-lg border border-emerald-200/90 bg-emerald-50/90 px-3 py-2 text-center text-[11px] leading-relaxed text-emerald-950 sm:text-left">
        <span className="font-semibold">Fast booking:</span> pick dates and guests, review the total, then pay securely — or
        request to book if the host must approve first.
      </p>
      <ol className="flex flex-wrap items-center justify-center gap-2 text-[10px] font-semibold text-slate-700 sm:justify-start">
        <li className="rounded-lg bg-white px-2.5 py-1 shadow-sm ring-1 ring-slate-200">1 · Dates &amp; guests</li>
        <li className="text-slate-400" aria-hidden>
          →
        </li>
        <li className="rounded-lg bg-neutral-100 px-2.5 py-1 text-slate-600 ring-1 ring-neutral-200">2 · Review price</li>
        <li className="text-slate-400" aria-hidden>
          →
        </li>
        <li className="rounded-lg bg-neutral-100 px-2.5 py-1 text-slate-600 ring-1 ring-neutral-200">3 · Pay or request</li>
      </ol>
      {!hostPayoutReady && (
        <div className="rounded-xl border border-amber-600/50 bg-amber-950/40 px-3 py-2 text-xs font-medium text-amber-100">
          <span className="rounded bg-amber-500/20 px-2 py-0.5 text-amber-200">
            Host not ready to receive payments
          </span>
          <p className="mt-2 text-amber-100/90">
            Booking is temporarily unavailable until the host completes Stripe payout setup.
          </p>
        </div>
      )}
      <div>
        <label id="bnhub-booking-check-in-label" className="mb-1 block text-xs font-medium text-slate-600">
          Check-in
        </label>
        <input
          type="date"
          aria-labelledby="bnhub-booking-check-in-label"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          min={new Date().toISOString().slice(0, 10)}
          className="w-full rounded-xl border border-neutral-300 bg-neutral-100 px-3 py-2.5 text-sm text-slate-900 focus:border-[#006ce4] focus:outline-none focus:ring-2 focus:ring-[#006ce4]/20"
        />
      </div>
      <div>
        <label id="bnhub-booking-check-out-label" className="mb-1 block text-xs font-medium text-slate-600">
          Check-out
        </label>
        <input
          type="date"
          aria-labelledby="bnhub-booking-check-out-label"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          min={checkIn || new Date().toISOString().slice(0, 10)}
          className="w-full rounded-xl border border-neutral-300 bg-neutral-100 px-3 py-2.5 text-sm text-slate-900 focus:border-[#006ce4] focus:outline-none focus:ring-2 focus:ring-[#006ce4]/20"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600">Guests</label>
        <input
          type="number"
          min={1}
          max={maxGuests}
          value={guestCount}
          onChange={(e) =>
            setGuestCount(Math.min(maxGuests, Math.max(1, parseInt(e.target.value, 10) || 1)))
          }
          className="w-full rounded-xl border border-neutral-300 bg-neutral-100 px-3 py-2.5 text-sm text-slate-900 focus:border-[#006ce4] focus:outline-none focus:ring-2 focus:ring-[#006ce4]/20"
        />
        <p className="mt-1 text-[11px] text-slate-500">Maximum {maxGuests} guests for this listing.</p>
      </div>
      <BnhubTrustSignals
        stripeCheckoutAvailable={Boolean(stripeConfigured && hostPayoutReady)}
        variant="formCompact"
        className="mt-1"
      />
      {nights < 1 ? (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Price summary</p>
          <dl className="mt-3 space-y-2.5 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-600">Price per night</dt>
              <dd className="tabular-nums font-semibold text-slate-900">{formatMoneyCents(nightPriceCents)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-600">Nights</dt>
              <dd className="text-slate-500">Select check-in &amp; check-out</dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-neutral-200 pt-2.5">
              <dt className="font-semibold text-slate-800">Total before payment</dt>
              <dd className="text-slate-500">—</dd>
            </div>
          </dl>
          <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
            Your total before payment will list lodging, cleaning (if any), service fee, and taxes when applicable — nothing
            is charged until you confirm.
          </p>
          <div className="mt-3">
            <BnhubPriceMayIncreaseHint />
          </div>
        </div>
      ) : null}
      {earlyHint && checkIn ? (
        <div className="rounded-xl border border-sky-500/25 bg-sky-950/30 px-3 py-2.5">
          <p className="text-xs font-semibold text-sky-200">{earlyHint.title}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-sky-100/90">{earlyHint.body}</p>
        </div>
      ) : null}
      {loyaltyTierBadge && guestId ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-3 py-2.5">
          <p className="text-xs font-semibold text-amber-100">BNHUB Rewards</p>
          <p className="mt-1 text-[11px] leading-relaxed text-amber-100/90">{loyaltyTierBadge}</p>
        </div>
      ) : null}
      {softDemandMerged ? (
        <p className="rounded-lg border border-neutral-200/90 bg-neutral-100 px-3 py-2 text-center text-[11px] leading-relaxed text-slate-500 sm:text-left">
          {softDemandMerged}
        </p>
      ) : null}
      {nights > 0 && (displayBreakdown.lodgingDiscountAppliedCents ?? 0) > 0 ? (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/25 px-3 py-2.5">
          <p className="text-xs font-semibold text-emerald-200">
            {displayBreakdown.lodgingDiscountSource === "LOYALTY"
              ? "Your loyalty discount applied"
              : "Early-booking rate applied"}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-emerald-100/90">
            {displayBreakdown.lodgingDiscountSource === "LOYALTY" && (displayBreakdown.loyaltyDiscountPercentOffered ?? 0) > 0
              ? `Your loyalty discount: ${displayBreakdown.loyaltyDiscountPercentOffered}% off the nightly subtotal (before taxes and service fee).`
              : `You save $${((displayBreakdown.lodgingDiscountAppliedCents ?? 0) / 100).toFixed(0)} on the nightly subtotal (before taxes and service fee).`}
          </p>
        </div>
      ) : null}
      {nights > 0 && (
        <>
          {instantBookEnabled && (
            <Link
              href={`/bnhub/checkout?listingId=${listingId}&checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}&guestCount=${Math.min(maxGuests, Math.max(1, guestCount))}`}
              className="mb-1 block text-center text-sm font-medium text-[#006ce4] hover:underline"
            >
              Proceed to checkout →
            </Link>
          )}
          <div className="rounded-xl border border-neutral-200 bg-neutral-100 p-5">
            <div className="mb-4">
              <BnhubPriceMayIncreaseHint />
            </div>
            <div className="mb-5 flex items-start justify-between gap-3 border-b border-neutral-200/80 pb-5">
              <div>
                <p className="text-sm font-semibold text-slate-900">Price summary</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Total before payment is what you review before paying · {bdCurrency}. Taxes may be included in the lines
                  below when quoted.
                </p>
              </div>
              {quoteLoading ? (
                <span className="shrink-0 text-[10px] font-medium text-slate-500">Updating…</span>
              ) : !hasLiveQuote ? (
                <span className="shrink-0 text-[10px] font-medium text-slate-600">Indicative</span>
              ) : (
                <span className="shrink-0 text-[10px] font-medium text-emerald-800">Live quote</span>
              )}
            </div>
            <div className="mb-5 space-y-2 rounded-lg border border-neutral-200/90 bg-white px-3 py-2.5 text-[13px]">
              <div className="flex justify-between gap-3">
                <span className="text-slate-600">Price per night</span>
                <span className="tabular-nums font-semibold text-slate-900">{formatMoneyCents(nightPriceCents)}</span>
              </div>
              <div className="flex justify-between gap-3 border-t border-dashed border-neutral-200/90 pt-2">
                <span className="text-slate-600">Nights</span>
                <span className="tabular-nums font-semibold text-slate-900">{displayBreakdown.nights}</span>
              </div>
            </div>
            <div className="mb-6 border-b border-neutral-200/90 pb-6">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">AI Price Insight</p>
              <p className="mt-2 text-sm font-medium leading-snug text-slate-800">{priceInsightLine}</p>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                Compared with similar published stays on BNHUB in this area — helps you judge value before you pay.
              </p>
            </div>
            {aiBookingLines.length > 0 ? (
              <div className="mb-6">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  AI Booking Insight
                </p>
                <div className="mt-2 space-y-2 text-xs leading-snug text-slate-700">
                  {aiBookingLines.map((line, i) => (
                    <p
                      key={i}
                      className={
                        line.startsWith("High demand for selected dates")
                          ? "rounded-lg border border-sky-200/90 bg-sky-50/90 px-3 py-2 font-medium text-sky-950"
                          : ""
                      }
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
            <div className={aiBookingLines.length > 0 ? "mb-6 border-t border-neutral-200/90 pt-6" : "mb-6 pt-0.5"}>
            {quoteLoading ? (
              <div className="space-y-3 pt-1 animate-pulse" aria-busy="true" aria-label="Loading price">
                <div className="h-3.5 rounded bg-neutral-200/90" />
                <div className="h-3.5 rounded bg-neutral-200/90" />
                <div className="h-3.5 rounded bg-neutral-200/90" />
                <div className="mt-4 h-12 rounded-lg bg-neutral-200" />
              </div>
            ) : (
              <div className="border-t border-neutral-200/90 pt-6">
                <div className="space-y-3 text-[13px] leading-snug">
                  <div className="flex justify-between gap-3 text-slate-500">
                    <span>
                      Nightly subtotal ({displayBreakdown.nights} night{displayBreakdown.nights !== 1 ? "s" : ""})
                    </span>
                    <span className="tabular-nums text-slate-500">{formatMoneyCents(displayBreakdown.subtotalCents)}</span>
                  </div>
                  {(displayBreakdown.lodgingDiscountAppliedCents ?? 0) > 0 && (
                    <>
                      <div className="flex justify-between gap-3 text-emerald-700/90">
                        <span>
                          {displayBreakdown.lodgingDiscountSource === "LOYALTY"
                            ? displayBreakdown.loyaltyDiscountLabel ?? "Loyalty savings"
                            : displayBreakdown.earlyBookingLabel ?? "Discount"}
                        </span>
                        <span className="tabular-nums">
                          −{formatMoneyCents(displayBreakdown.lodgingDiscountAppliedCents ?? 0)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3 border-t border-dashed border-neutral-200/90 pt-3 text-slate-600">
                        <span className="font-medium">Lodging (after discounts)</span>
                        <span className="tabular-nums font-medium text-slate-700">
                          {formatMoneyCents(
                            displayBreakdown.lodgingSubtotalAfterDiscountCents ?? displayBreakdown.subtotalCents
                          )}
                        </span>
                      </div>
                    </>
                  )}
                  {displayBreakdown.cleaningFeeCents > 0 && (
                    <div className="flex justify-between gap-3 text-slate-500">
                      <span>Cleaning fee</span>
                      <span className="tabular-nums">{formatMoneyCents(displayBreakdown.cleaningFeeCents)}</span>
                    </div>
                  )}
                  {displayBreakdown.taxCents > 0 && (
                    <>
                      {displayBreakdown.gstCents != null &&
                      displayBreakdown.qstCents != null &&
                      (displayBreakdown.gstCents > 0 || displayBreakdown.qstCents > 0) ? (
                        <>
                          {displayBreakdown.gstCents > 0 && (
                            <div className="flex justify-between gap-3 text-slate-500">
                              <span>GST (5%)</span>
                              <span className="tabular-nums">{formatMoneyCents(displayBreakdown.gstCents)}</span>
                            </div>
                          )}
                          {displayBreakdown.qstCents > 0 && (
                            <div className="flex justify-between gap-3 text-slate-500">
                              <span>QST (9.975%)</span>
                              <span className="tabular-nums">{formatMoneyCents(displayBreakdown.qstCents)}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex justify-between gap-3 text-slate-500">
                          <span>Taxes (GST + QST)</span>
                          <span className="tabular-nums">{formatMoneyCents(displayBreakdown.taxCents)}</span>
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex justify-between gap-3 text-slate-500">
                    <span>Service fee</span>
                    <span className="tabular-nums">{formatMoneyCents(displayBreakdown.serviceFeeCents)}</span>
                  </div>
                </div>
                <div className="mt-6 rounded-xl border border-neutral-200/90 bg-neutral-100 px-4 py-4 shadow-sm">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-semibold text-slate-800">Total before payment</span>
                    <span className="text-2xl font-bold tabular-nums tracking-tight text-slate-900">
                      {formatMoneyCents(displayBreakdown.totalCents)}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] leading-snug text-slate-500">
                    This is the amount due for the stay and fees shown above before any separate card or bank step. If
                    taxes are listed, they are part of this total.
                  </p>
                </div>
              </div>
            )}
          </div>
          </div>
        </>
      )}
      {hasRulesToConfirm && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-3">
          {cancellationPolicy && (
            <p className="text-xs text-slate-400">
              <span className="font-medium text-slate-300">Cancellation:</span> {cancellationPolicy}
            </p>
          )}
          <label className="mt-2 flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={agreedToRules}
              onChange={(e) => setAgreedToRules(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-400"
            />
            <span className="text-sm text-slate-300">
              I agree to the house rules{cancellationPolicy ? " and cancellation policy" : ""}.
            </span>
          </label>
        </div>
      )}
      <details className="rounded-xl border border-slate-700/80 bg-slate-900/35 p-3 open:pb-4">
        <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-wide text-slate-500 [&::-webkit-details-marker]:hidden">
          <span className="text-slate-400">▸</span> Services &amp; add-ons <span className="font-normal normal-case text-slate-500">(optional)</span>
        </summary>
        <div className="mt-3 space-y-3">
        <p className="text-[11px] text-slate-500">Requests are not guaranteed — the host will confirm what&apos;s possible.</p>
        <div className="flex flex-col gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={svcAirportPickup}
              onChange={(e) => setSvcAirportPickup(e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500"
            />
            Airport pickup
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={svcParking}
              onChange={(e) => setSvcParking(e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500"
            />
            Parking
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={svcShuttle}
              onChange={(e) => setSvcShuttle(e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500"
            />
            Shuttle
          </label>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">Other services (optional)</label>
          <input
            type="text"
            value={extraServicesText}
            onChange={(e) => setExtraServicesText(e.target.value)}
            placeholder="e.g. crib, high chair, grocery stock"
            className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
          />
        </div>
        </div>
      </details>

      <details className="rounded-xl border border-slate-700/80 bg-slate-900/35 p-3 open:pb-4">
        <summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-wide text-slate-500 [&::-webkit-details-marker]:hidden">
          <span className="text-slate-400">▸</span> Traveling with a pet? <span className="font-normal normal-case text-slate-500">(optional)</span>
        </summary>
        <div className="mt-3 space-y-3">
        {petsAllowed === false && (
          <p className="rounded-lg border border-amber-600/40 bg-amber-950/30 px-2 py-1.5 text-[11px] text-amber-100/95">
            This listing is not marked as pet-friendly. You can still note a pet below — the host may decline or ask you to adjust.
          </p>
        )}
        {petsAllowed === true && maxPetWeightKg != null && maxPetWeightKg > 0 && (
          <p className="text-[11px] text-slate-500">Host indicates max pet weight around {maxPetWeightKg} kg.</p>
        )}
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={travelingWithPet}
            onChange={(e) => setTravelingWithPet(e.target.checked)}
            className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500"
          />
          I&apos;m bringing a pet
        </label>
        {travelingWithPet && (
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-500">Type</label>
              <select
                value={guestPetType}
                onChange={(e) => setGuestPetType(e.target.value as PetType)}
                className="rounded-lg border border-slate-700 bg-slate-950/60 px-2 py-1.5 text-sm text-slate-100"
              >
                <option value="dog">Dog</option>
                <option value="cat">Cat</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-500">Weight (kg)</label>
              <input
                type="number"
                min={0}
                step={1}
                value={guestPetWeightKg}
                onChange={(e) => setGuestPetWeightKg(e.target.value)}
                placeholder="—"
                className="w-24 rounded-lg border border-slate-700 bg-slate-950/60 px-2 py-1.5 text-sm text-slate-100"
              />
            </div>
          </div>
        )}
        </div>
      </details>

      {guestId ? (
        <details className="rounded-xl border border-slate-700/80 bg-slate-900/35 p-3 open:pb-4">
          <summary className="cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#D4AF37]" aria-hidden />
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Insurance quote <span className="font-normal normal-case text-slate-500">(optional)</span>
              </p>
            </div>
          </summary>
        <div className="mt-3 space-y-3">
          <p className="text-[11px] text-slate-500">
            Separate from your booking request. Connects you with a licensed broker for travel / rental-stay coverage
            — not a bound policy.
          </p>
          <label className="block text-xs font-medium text-slate-400">
            Email
            <input
              type="email"
              value={insuranceEmail}
              onChange={(e) => setInsuranceEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>
          <label className="flex cursor-pointer items-start gap-2 text-[11px] text-slate-400">
            <input
              type="checkbox"
              checked={insuranceConsent}
              onChange={(e) => setInsuranceConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500"
            />
            <span>{INSURANCE_LEAD_CONSENT_LABEL}</span>
          </label>
          <button
            type="button"
            disabled={insuranceBusy}
            onClick={() => void submitInsuranceQuoteRequest()}
            className="w-full rounded-lg border border-[#D4AF37]/40 bg-black/30 py-2.5 text-sm font-semibold text-[#E8D589] transition hover:bg-black/45 disabled:opacity-50"
          >
            {insuranceBusy ? "Sending…" : "Request insurance quote"}
          </button>
          {insuranceFeedback ? (
            <p className="text-[11px] leading-snug text-slate-400">{insuranceFeedback}</p>
          ) : null}
        </div>
        </details>
      ) : null}

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-400">
          Notes for the host (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          placeholder="e.g. late check-in window, accessibility, anything else"
          className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
        />
      </div>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      {showHostCredibility ? (
        <div className="rounded-xl border border-neutral-200 bg-neutral-100 px-3 py-2.5 text-xs text-slate-600">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Host</p>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-800">
            {hostIsSuperHost ? (
              <span className="rounded bg-violet-100 px-2 py-0.5 text-[11px] font-semibold text-violet-900">
                Superhost
              </span>
            ) : null}
            {hostAvgRating != null && hostAvgRating > 0 ? (
              <span className="font-medium">★ {hostAvgRating.toFixed(1)}</span>
            ) : null}
            {hostReviewCount > 0 ? (
              <span className="text-slate-600">
                {hostReviewCount} review{hostReviewCount !== 1 ? "s" : ""}
              </span>
            ) : null}
            {responseLabel ? <span className="text-slate-600">{responseLabel}</span> : null}
          </p>
        </div>
      ) : null}
      {hostPayoutReady ? (
        <div className="rounded-xl border border-neutral-200 bg-neutral-100 px-3 py-2.5 text-xs leading-relaxed text-slate-600">
          {!instantBookEnabled ? (
            <>
              <p className="font-semibold text-slate-900">You will not be charged yet</p>
              <p className="mt-1">
                The host reviews your request first. Payment is only due after they approve.
              </p>
            </>
          ) : stripeConfigured ? (
            <p>You won&apos;t be charged until you complete checkout on the next step.</p>
          ) : (
            <p>You won&apos;t be charged until your booking is confirmed and payment is available.</p>
          )}
        </div>
      ) : null}
      {guestId ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-100 px-3 py-2 text-[10px] text-slate-500">
          {instantBookEnabled && stripeConfigured && hostPayoutReady ? (
            <HintTooltip label="Card details are entered on Stripe’s secure checkout page after you continue.">
              <span className="cursor-help text-slate-700">Stripe checkout</span>
            </HintTooltip>
          ) : null}
          {listingVerified ? (
            <HintTooltip label="This listing passed platform verification checks.">
              <span className="cursor-help text-slate-700">Verified listing</span>
            </HintTooltip>
          ) : null}
          <HintTooltip label="You’ll get booking confirmation after payment completes (or after host approval if not instant book).">
            <span className="cursor-help text-slate-700">Confirmation</span>
          </HintTooltip>
          {cancellationPolicy ? (
            <HintTooltip label={cancellationPolicy}>
              <span className="cursor-help text-slate-700">Cancellation policy</span>
            </HintTooltip>
          ) : null}
          {instantBookEnabled ? (
            <HintTooltip label="Eligible stays may confirm instantly after checkout.">
              <span className="cursor-help text-emerald-800">Instant book</span>
            </HintTooltip>
          ) : null}
        </div>
      ) : null}
      <p className="mb-2 text-center text-sm font-semibold text-slate-800">{LISTING_EXPLORE_NO_PAYMENT_LINE}</p>
      {hostPayoutReady && stripeConfigured ? (
        <p className="mb-2 text-center text-sm font-semibold text-slate-800">Secure payment via Stripe</p>
      ) : null}
      <p className="mb-3 text-center text-xs leading-relaxed text-slate-600 sm:text-left">
        {!guestId
          ? hostPayoutReady && instantBookEnabled && stripeConfigured
            ? "Pick dates, then continue — you’ll sign in only when you’re ready to pay."
            : hostPayoutReady
              ? "Pick dates and continue — sign in when you confirm your request."
              : "Review your stay details before continuing."
          : hostPayoutReady && instantBookEnabled && stripeConfigured
            ? "Next: secure checkout — confirm the total before payment matches what you expect."
            : hostPayoutReady
              ? "Review the total before payment — the host may need to approve before any charge."
              : "Review your stay details before continuing."}
      </p>
      <button
        type="submit"
        disabled={
          loading ||
          nights < 1 ||
          (hasRulesToConfirm && !agreedToRules) ||
          !hostPayoutReady
        }
        className={CTA_PRIMARY_FULL_WIDTH}
      >
        {loading
          ? "Booking…"
          : !guestId
            ? instantBookEnabled
              ? "Book now"
              : "Request to book"
            : instantBookEnabled
              ? "Book now"
              : "Request to book"}
      </button>
      <div
        className="mt-3 flex flex-col gap-3 border-t border-neutral-200/90 pt-3 sm:items-start"
        role="region"
        aria-label="Booking safety"
      >
        <BnhubTrustSignals
          stripeCheckoutAvailable={Boolean(stripeConfigured && hostPayoutReady)}
          variant="formCompact"
          className="w-full justify-center sm:justify-start"
        />
        <div className="w-full space-y-1 text-center text-[11px] leading-relaxed text-slate-500 sm:text-left">
          <p>Your payment is handled securely — you review every line before confirming.</p>
          {stripeConfigured && hostPayoutReady ? (
            <BnhubStripeTrustHint className="w-full pt-1" variant="prominent" tone="light" />
          ) : null}
        </div>
      </div>
    </form>
  );
}
