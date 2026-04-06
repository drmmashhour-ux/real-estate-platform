"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HintTooltip } from "@/components/ui/HintTooltip";
import { CTA_PRIMARY_FULL_WIDTH } from "@/lib/ui/cta-classes";
import { earlyBookingHintForLeadDays, nightsUntilCheckInUtc } from "@/lib/bnhub/early-booking";

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
}: {
  listingId: string;
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
  /** BNHub Rewards tier label for signed-in guests (e.g. Silver · up to 5% off lodging). */
  loyaltyTierBadge?: string | null;
}) {
  const router = useRouter();
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
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
  const [guestCount, setGuestCount] = useState(Math.min(2, Math.max(1, maxGuests)));
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
      return;
    }
    const ctrl = new AbortController();
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
        }>;
      })
      .then((q) => {
        if (!q) {
          setBreakdown(null);
          return;
        }
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
      .catch(() => setBreakdown(null));
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
    currency: "USD",
    nightlyBreakdown: [],
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!guestId) {
      setError("Sign in required to book.");
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
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-[#006ce4] focus:outline-none focus:ring-2 focus:ring-[#006ce4]/20"
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
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-[#006ce4] focus:outline-none focus:ring-2 focus:ring-[#006ce4]/20"
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
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-[#006ce4] focus:outline-none focus:ring-2 focus:ring-[#006ce4]/20"
        />
        <p className="mt-1 text-[11px] text-slate-500">Maximum {maxGuests} guests for this listing.</p>
      </div>
      {earlyHint && checkIn ? (
        <div className="rounded-xl border border-sky-500/25 bg-sky-950/30 px-3 py-2.5">
          <p className="text-xs font-semibold text-sky-200">{earlyHint.title}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-sky-100/90">{earlyHint.body}</p>
        </div>
      ) : null}
      {loyaltyTierBadge && guestId ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-3 py-2.5">
          <p className="text-xs font-semibold text-amber-100">BNHub Rewards</p>
          <p className="mt-1 text-[11px] leading-relaxed text-amber-100/90">{loyaltyTierBadge}</p>
        </div>
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
              href={`/bnhub/checkout?listingId=${listingId}&checkIn=${checkIn}&checkOut=${checkOut}`}
              className="mb-2 block text-center text-sm text-emerald-400 hover:text-emerald-300"
            >
              Proceed to checkout →
            </Link>
          )}
          <div className="border-t border-slate-700 pt-4 text-sm">
          <div className="flex justify-between text-slate-400">
            <span>Nightly total ({displayBreakdown.nights} nights)</span>
            <span>${(displayBreakdown.subtotalCents / 100).toFixed(0)}</span>
          </div>
          {(displayBreakdown.lodgingDiscountAppliedCents ?? 0) > 0 && (
            <div className="flex justify-between text-emerald-400">
              <span>
                {displayBreakdown.lodgingDiscountSource === "LOYALTY"
                  ? displayBreakdown.loyaltyDiscountLabel ?? "Loyalty savings"
                  : displayBreakdown.earlyBookingLabel ?? "Early booking"}
              </span>
              <span>-${((displayBreakdown.lodgingDiscountAppliedCents ?? 0) / 100).toFixed(0)}</span>
            </div>
          )}
          {displayBreakdown.cleaningFeeCents > 0 && (
            <div className="flex justify-between text-slate-400">
              <span>Cleaning fee</span>
              <span>${(displayBreakdown.cleaningFeeCents / 100).toFixed(0)}</span>
            </div>
          )}
          {displayBreakdown.taxCents > 0 && (
            <>
              {displayBreakdown.gstCents != null &&
              displayBreakdown.qstCents != null &&
              (displayBreakdown.gstCents > 0 || displayBreakdown.qstCents > 0) ? (
                <>
                  {displayBreakdown.gstCents > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>GST (5%)</span>
                      <span>${(displayBreakdown.gstCents / 100).toFixed(2)}</span>
                    </div>
                  )}
                  {displayBreakdown.qstCents > 0 && (
                    <div className="flex justify-between text-slate-400">
                      <span>QST (9.975%)</span>
                      <span>${(displayBreakdown.qstCents / 100).toFixed(2)}</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex justify-between text-slate-400">
                  <span>Taxes (GST + QST)</span>
                  <span>${(displayBreakdown.taxCents / 100).toFixed(2)}</span>
                </div>
              )}
            </>
          )}
          <div className="flex justify-between text-slate-400">
            <span>Service fee</span>
            <span>${(displayBreakdown.serviceFeeCents / 100).toFixed(0)}</span>
          </div>
          <div className="mt-2 flex justify-between font-semibold text-slate-100">
            <span>Total</span>
            <span>${(displayBreakdown.totalCents / 100).toFixed(0)}</span>
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
      <div className="rounded-xl border border-slate-700/80 bg-slate-900/35 p-3 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Services &amp; add-ons</p>
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

      <div className="rounded-xl border border-slate-700/80 bg-slate-900/35 p-3 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Traveling with a pet?</p>
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
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
      {guestId ? (
        <div className="space-y-2">
          {stripeConfigured && instantBookEnabled && hostPayoutReady ? (
            <p className="text-xs font-medium text-emerald-200/95">
              You won&apos;t be charged until you complete secure Stripe checkout.
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-900/50 px-3 py-2 text-[10px] text-slate-400">
            <HintTooltip label="Secure payment with Stripe — card processed at checkout.">
              <span className="text-slate-300">Secure checkout</span>
            </HintTooltip>
            {listingVerified ? (
              <HintTooltip label="This listing passed platform verification checks.">
                <span className="text-sky-300/90">Verified listing</span>
              </HintTooltip>
            ) : null}
            <HintTooltip label="You’ll get booking confirmation after payment completes (or after host approval if not instant book).">
              <span className="text-slate-300">Confirmation</span>
            </HintTooltip>
            {cancellationPolicy ? (
              <HintTooltip label={cancellationPolicy}>
                <span className="text-slate-300">Cancellation policy</span>
              </HintTooltip>
            ) : null}
            {instantBookEnabled ? (
              <HintTooltip label="Eligible stays may confirm instantly after checkout.">
                <span className="text-emerald-300/90">Instant book</span>
              </HintTooltip>
            ) : null}
          </div>
        </div>
      ) : null}
      {!guestId ? (
        <Link
              href={`/bnhub/login?next=${encodeURIComponent(`/bnhub/stays/${listingId}`)}`}
          className={`block text-center ${CTA_PRIMARY_FULL_WIDTH}`}
        >
          Sign in to book
        </Link>
      ) : (
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
              : instantBookEnabled
                ? "Book now — instant confirmation"
                : "Reserve now — pay securely"}
        </button>
      )}
    </form>
  );
}
