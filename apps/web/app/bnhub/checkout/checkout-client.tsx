"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TrustStrip } from "@/components/ui/TrustStrip";
import { ContentLicenseModal } from "@/components/legal/ContentLicenseModal";
import { CONTENT_LICENSE_ERROR } from "@/lib/legal/content-license-client";
import { CONTENT_LICENSE_VERSION } from "@/modules/legal/content-license";
import { LegalActionWarningModal } from "@/components/legal/LegalActionWarningModal";
import { ServiceSelector, type SelectionMap } from "@/components/bnhub/services/ServiceSelector";
import { BookingServicesSummary } from "@/components/bnhub/services/BookingServicesSummary";
import type { GuestOfferCard } from "@/components/bnhub/services/ServiceCard";

type Breakdown = {
  subtotalCents: number;
  cleaningFeeCents: number;
  gstCents?: number;
  qstCents?: number;
  taxCents: number;
  serviceFeeCents: number;
  lodgingTotalBeforeAddonsCents: number;
  addonLines: {
    name: string;
    quantity: number;
    unitPriceCents: number;
    totalPriceCents: number;
    requiresApproval?: boolean;
    isIncluded?: boolean;
  }[];
  addonsSubtotalCents: number;
  totalCents: number;
  nights: number;
};

export function BNHubCheckoutClient({
  listingId,
  listingTitle,
  maxGuests,
  checkIn,
  checkOut,
  guestId,
  houseRules,
  cancellationPolicy,
  hostPayoutReady = true,
}: {
  listingId: string;
  listingTitle: string;
  maxGuests: number;
  checkIn: string;
  checkOut: string;
  guestId: string | null;
  houseRules: string | null;
  cancellationPolicy: string | null;
  hostPayoutReady?: boolean;
}) {
  const router = useRouter();
  const [breakdown, setBreakdown] = useState<Breakdown | null>(null);
  const [offers, setOffers] = useState<GuestOfferCard[]>([]);
  const [suggestedCodes, setSuggestedCodes] = useState<string[]>([]);
  const [guestCount, setGuestCount] = useState(2);
  const [selectedAddons, setSelectedAddons] = useState<SelectionMap>({});
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [licenseOpen, setLicenseOpen] = useState(false);
  const [licenseVersion, setLicenseVersion] = useState<string>(CONTENT_LICENSE_VERSION);
  const [legalWarnOpen, setLegalWarnOpen] = useState(false);
  const [legalWarnMessage, setLegalWarnMessage] = useState("");
  const pendingLegalRef = useRef<(() => void) | null>(null);
  const skipLegalAiRef = useRef(false);

  const hasRules = Boolean(houseRules || cancellationPolicy);

  const servicesPayload = useMemo(() => {
    const arr = Object.entries(selectedAddons)
      .filter(([, q]) => q > 0)
      .map(([listingServiceId, quantity]) => ({ listingServiceId, quantity }));
    return arr.length ? JSON.stringify(arr) : null;
  }, [selectedAddons]);

  useEffect(() => {
    fetch(`/api/bnhub/listings/${listingId}/hospitality-offers`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.offers) return;
        setOffers(d.offers as GuestOfferCard[]);
        setSuggestedCodes(d.suggestedServiceCodes ?? []);
      })
      .catch(() => {
        setOffers([]);
        setSuggestedCodes([]);
      });
  }, [listingId]);

  useEffect(() => {
    const params = new URLSearchParams({
      listingId,
      checkIn,
      checkOut,
      guestCount: String(Math.min(maxGuests, Math.max(1, guestCount))),
    });
    if (servicesPayload) params.set("services", servicesPayload);
    fetch(`/api/bnhub/pricing/breakdown?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const b = d?.breakdown;
        if (!b) {
          setBreakdown(null);
          return;
        }
        setBreakdown({
          subtotalCents: b.subtotalCents,
          cleaningFeeCents: b.cleaningFeeCents,
          gstCents: b.gstCents,
          qstCents: b.qstCents,
          taxCents: b.taxCents,
          serviceFeeCents: b.serviceFeeCents,
          lodgingTotalBeforeAddonsCents:
            b.lodgingTotalBeforeAddonsCents ??
            b.subtotalCents + b.cleaningFeeCents + b.taxCents + b.serviceFeeCents,
          addonLines: b.addonLines ?? [],
          addonsSubtotalCents: b.addonsSubtotalCents ?? 0,
          totalCents: b.totalCents,
          nights: b.nights,
        });
      })
      .catch(() => setBreakdown(null));
  }, [listingId, checkIn, checkOut, guestCount, maxGuests, servicesPayload]);

  async function submitBooking() {
    if (!guestId) {
      setError("Sign in required.");
      return;
    }
    if (hasRules && !agreed) {
      setError("Please agree to the house rules and cancellation policy.");
      return;
    }
    if (!hostPayoutReady) {
      setError("Host payout account is not configured yet.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      if (!skipLegalAiRef.current) {
        const ev = await fetch("/api/legal/ai/evaluate-action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            hub: "bnhub",
            actionType: "booking",
            entity: { listingId, checkIn, checkOut, listingTitle },
          }),
        });
        const ej = (await ev.json()) as { requiresConfirmation?: boolean; message?: string };
        if (ev.ok && ej.requiresConfirmation && typeof ej.message === "string") {
          setLegalWarnMessage(ej.message);
          pendingLegalRef.current = () => {
            skipLegalAiRef.current = true;
            setLegalWarnOpen(false);
            void submitBooking();
          };
          setLegalWarnOpen(true);
          return;
        }
      }
      skipLegalAiRef.current = false;

      const selectedAddonsPayload = Object.entries(selectedAddons)
        .filter(([, q]) => q > 0)
        .map(([listingServiceId, quantity]) => ({ listingServiceId, quantity }));

      const res = await fetch("/api/bnhub/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          listingId,
          checkIn,
          checkOut,
          guestCount: Math.min(maxGuests, Math.max(1, guestCount)),
          selectedAddons: selectedAddonsPayload.length ? selectedAddonsPayload : undefined,
        }),
      });
      const data = (await res.json()) as { error?: string; requiredVersion?: string; id?: string };
      if (!res.ok) {
        if (data.error === CONTENT_LICENSE_ERROR && data.requiredVersion) {
          setLicenseVersion(data.requiredVersion);
          setLicenseOpen(true);
          return;
        }
        throw new Error(data.error ?? "Booking failed");
      }
      router.push(`/bnhub/booking/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Booking failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submitBooking();
  }

  const nights = breakdown?.nights ?? 0;

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in space-y-6">
      {!hostPayoutReady && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-950/35 p-4 text-sm text-amber-100">
          <span className="font-semibold text-amber-200">Host not ready to receive payments</span>
          <p className="mt-1 text-amber-100/85">
            This listing cannot accept checkout until the host completes Stripe Connect payout setup.
            You can still contact the host from the listing page.
          </p>
        </div>
      )}
      <TrustStrip audience="stays" />
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-black/20">
        <h2 className="text-lg font-semibold text-slate-200">Your trip</h2>
        <p className="mt-1 text-slate-400">
          {checkIn} – {checkOut} · {nights} night{nights !== 1 ? "s" : ""}
        </p>
        <p className="mt-2 text-slate-300">{listingTitle}</p>
        <label className="mt-4 flex max-w-xs flex-col gap-1 text-sm text-slate-400">
          Guests
          <input
            type="number"
            min={1}
            max={maxGuests}
            value={guestCount}
            onChange={(e) =>
              setGuestCount(Math.min(maxGuests, Math.max(1, parseInt(e.target.value, 10) || 1)))
            }
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-slate-200"
          />
        </label>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-black/20">
        <ServiceSelector
          offers={offers}
          suggestedServiceCodes={suggestedCodes}
          value={selectedAddons}
          onChange={setSelectedAddons}
        />
      </div>

      {breakdown && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg shadow-black/20">
          <h2 className="text-lg font-semibold text-slate-200">Price breakdown</h2>
          <p className="mt-1 text-xs text-slate-500">Taxes and fees shown before you pay — no hidden charges at checkout.</p>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Stay subtotal ({breakdown.nights} night{breakdown.nights !== 1 ? "s" : ""})</span>
              <span>${(breakdown.subtotalCents / 100).toFixed(0)}</span>
            </div>
            {breakdown.cleaningFeeCents > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Cleaning fee</span>
                <span>${(breakdown.cleaningFeeCents / 100).toFixed(0)}</span>
              </div>
            )}
            {breakdown.taxCents > 0 && (
              <>
                {breakdown.gstCents != null &&
                breakdown.qstCents != null &&
                (breakdown.gstCents > 0 || breakdown.qstCents > 0) ? (
                  <>
                    {breakdown.gstCents > 0 && (
                      <div className="flex justify-between text-slate-400">
                        <span>GST (5%)</span>
                        <span>${(breakdown.gstCents / 100).toFixed(2)}</span>
                      </div>
                    )}
                    {breakdown.qstCents > 0 && (
                      <div className="flex justify-between text-slate-400">
                        <span>QST (9.975%)</span>
                        <span>${(breakdown.qstCents / 100).toFixed(2)}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex justify-between text-slate-400">
                    <span>Taxes (GST + QST)</span>
                    <span>${(breakdown.taxCents / 100).toFixed(2)}</span>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between text-slate-400">
              <span>Service fee</span>
              <span>${(breakdown.serviceFeeCents / 100).toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span className="text-xs">Room &amp; fees subtotal</span>
              <span className="text-xs">${(breakdown.lodgingTotalBeforeAddonsCents / 100).toFixed(2)}</span>
            </div>
            <BookingServicesSummary
              lines={breakdown.addonLines.map((l) => ({
                name: l.name,
                quantity: l.quantity,
                unitPriceCents: l.unitPriceCents,
                totalPriceCents: l.totalPriceCents,
                requiresApproval: l.requiresApproval,
                isIncluded: l.isIncluded,
              }))}
              addonsSubtotalCents={breakdown.addonsSubtotalCents}
            />
            <div className="flex justify-between border-t border-slate-700 pt-3 font-semibold text-slate-100">
              <span>Total</span>
              <span>${(breakdown.totalCents / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {hasRules && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          {cancellationPolicy && (
            <p className="text-sm text-slate-400">
              <span className="font-medium text-slate-300">Cancellation policy:</span> {cancellationPolicy}
            </p>
          )}
          {houseRules && (
            <p className="mt-2 text-sm text-slate-400">
              <span className="font-medium text-slate-300">House rules:</span> {houseRules}
            </p>
          )}
          <label className="mt-4 flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-800 text-emerald-500"
            />
            <span className="text-sm text-slate-300">I agree to the house rules and cancellation policy.</span>
          </label>
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex flex-wrap gap-3">
        {!guestId ? (
          <Link
            href={`/bnhub/login?next=${encodeURIComponent(`/bnhub/checkout?listingId=${listingId}&checkIn=${checkIn}&checkOut=${checkOut}`)}`}
            className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          >
            Sign in to book
          </Link>
        ) : (
          <button
            type="submit"
            disabled={loading || !breakdown || (hasRules && !agreed) || !hostPayoutReady}
            className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? "Reserving…" : "Confirm and pay"}
          </button>
        )}
        <Link
          href={`/bnhub/${listingId}`}
          className="rounded-xl border border-slate-600 px-6 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800"
        >
          Cancel
        </Link>
      </div>

      <ContentLicenseModal
        open={licenseOpen}
        requiredVersion={licenseVersion}
        onClose={() => setLicenseOpen(false)}
        onAccepted={() => {
          setLicenseOpen(false);
          void submitBooking();
        }}
      />

      <LegalActionWarningModal
        open={legalWarnOpen}
        message={legalWarnMessage}
        onCancel={() => {
          pendingLegalRef.current = null;
          setLegalWarnOpen(false);
        }}
        onConfirm={() => {
          const fn = pendingLegalRef.current;
          pendingLegalRef.current = null;
          fn?.();
        }}
      />
    </form>
  );
}
