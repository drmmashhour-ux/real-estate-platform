"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HintTooltip } from "@/components/ui/HintTooltip";
import { CTA_PRIMARY_FULL_WIDTH } from "@/lib/ui/cta-classes";

type PricingBreakdown = {
  nightlyBreakdown: { date: string; cents: number }[];
  subtotalCents: number;
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
  const hasRulesToConfirm = Boolean(houseRules || cancellationPolicy);

  const nights =
    checkIn && checkOut
      ? Math.ceil(
          (new Date(checkOut).getTime() - new Date(checkIn).getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

  useEffect(() => {
    if (!listingId || !checkIn || !checkOut || nights < 1) {
      setBreakdown(null);
      return;
    }
    const params = new URLSearchParams({ listingId, checkIn, checkOut });
    fetch(`/api/bnhub/pricing/breakdown?${params}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data?.breakdown ?? null)
      .then(setBreakdown)
      .catch(() => setBreakdown(null));
  }, [listingId, checkIn, checkOut, nights]);

  const displayBreakdown = breakdown ?? {
    subtotalCents: nights * nightPriceCents,
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

      const res = await fetch("/api/bnhub/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          checkIn,
          checkOut,
          specialRequest: notes.trim() || undefined,
          ...(hasStructured ? { specialRequestsJson } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Booking failed");
      router.push(`/bnhub/booking/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
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
        <label className="mb-1 block text-xs font-medium text-slate-400">
          Check-in
        </label>
        <input
          type="date"
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
          min={new Date().toISOString().slice(0, 10)}
          className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-400">
          Check-out
        </label>
        <input
          type="date"
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
          min={checkIn || new Date().toISOString().slice(0, 10)}
          className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
        />
      </div>
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
            <span>${(displayBreakdown.subtotalCents / 100).toFixed(0)} × {displayBreakdown.nights} nights</span>
            <span>${(displayBreakdown.subtotalCents / 100).toFixed(0)}</span>
          </div>
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
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-900/50 px-3 py-2 text-[10px] text-slate-400">
          <HintTooltip label="Secure payment with Stripe — card processed at checkout.">
            <span className="text-slate-300">Secure payment</span>
          </HintTooltip>
          <HintTooltip label="You’ll get booking confirmation after payment completes (or after host approval if not instant book).">
            <span className="text-slate-300">Confirmation</span>
          </HintTooltip>
          {instantBookEnabled ? (
            <HintTooltip label="Eligible stays may confirm instantly after checkout.">
              <span className="text-emerald-300/90">Instant book</span>
            </HintTooltip>
          ) : null}
        </div>
      ) : null}
      {!guestId ? (
        <Link
          href={`/bnhub/login?next=${encodeURIComponent(`/bnhub/${listingId}`)}`}
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
                ? "Book now"
                : "Request to book"}
        </button>
      )}
    </form>
  );
}
