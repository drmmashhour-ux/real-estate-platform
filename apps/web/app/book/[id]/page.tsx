"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

import { calculateTotalPrice, dateFromYmd, totalWithPlatformFeeCents } from "@/lib/pricing/calculateTotal";
import { trackEvent } from "@/src/services/analytics";
import { nightYmdKeysForStay } from "@/lib/booking/nightYmdsBetween";
import { endYmdForSameSpan } from "@/lib/booking/staySpan";
import type { ListingDailyCalendarDay } from "@/lib/booking/dailyCalendarQuery";
import { BookingSummary } from "./BookingSummary";
import { HelpBanner } from "@/components/support/HelpBanner";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function toISODateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function rangeTouchesBooked(
  from: Date,
  to: Date,
  cal: Record<string, ListingDailyCalendarDay> | null
) {
  if (!cal) return false;
  let lo = startOfLocalDay(from);
  let hi = startOfLocalDay(to);
  if (lo.getTime() > hi.getTime()) {
    const t = lo;
    lo = hi;
    hi = t;
  }
  const cur = new Date(lo);
  while (cur.getTime() <= hi.getTime()) {
    const ymd = toISODateLocal(cur);
    if (cal[ymd]?.booked) return true;
    cur.setDate(cur.getDate() + 1);
  }
  return false;
}

function stayNightsFromRange(start: Date, end: Date): number {
  const n = (end.getTime() - start.getTime()) / MS_PER_DAY;
  if (n <= 0) return 1;
  return Math.max(1, Math.round(n));
}

type CalendarPayload = { days: ListingDailyCalendarDay[] };

type ConflictSug = {
  nextAvailableStart: string | null;
  nearestRanges: { startDate: string; endDate: string }[];
};

export default function BookingPage() {
  const params = useParams();
  const listingId = typeof params?.id === "string" ? params.id : "";
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [range, setRange] = useState<[Date, Date] | Date | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflictSuggestions, setConflictSuggestions] = useState<ConflictSug | null>(null);
  const [rejectedAttempt, setRejectedAttempt] = useState<{ start: string; end: string } | null>(null);
  const [listing, setListing] = useState<{ price: number; title?: string; city?: string } | null>(null);
  const [viewYearMonth, setViewYearMonth] = useState(() => ({
    y: new Date().getFullYear(),
    m: new Date().getMonth(),
  }));
  const [calByYmd, setCalByYmd] = useState<Record<string, ListingDailyCalendarDay> | null>(null);
  const [calLoading, setCalLoading] = useState(true);
  /** From booking overlap engine — first night with no block (A.1). */
  const [nextAvailableIso, setNextAvailableIso] = useState<string | null | undefined>(undefined);
  const [availabilityLoaded, setAvailabilityLoaded] = useState(false);
  /** Set after successful POST /api/bookings — 15m hold (Order 57.1). */
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  /** Order 61 — GET /api/bookings/quote; server is source of truth for checkout. */
  const [dynamicQuote, setDynamicQuote] = useState<{
    nightlyPrices: { date: string; priceCents: number; reasons: string[] }[];
    subtotalCents: number;
    platformFeeCents: number;
    finalCents: number;
  } | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);

  const loadCalendar = useCallback(
    (y: number, m: number) => {
      if (!listingId) return;
      const startYmd = toISODateLocal(new Date(y, m, 1));
      const endYmd = toISODateLocal(new Date(y, m + 1, 0));
      setCalLoading(true);
      const url = `/api/listings/${encodeURIComponent(
        listingId
      )}/calendar?start=${encodeURIComponent(startYmd)}&end=${encodeURIComponent(endYmd)}`;
      fetch(url)
        .then((r) => (r.ok ? r.json() : null))
        .then((data: unknown) => {
          if (!data || typeof data !== "object" || !("days" in data)) {
            setCalByYmd({});
            return;
          }
          const days = (data as CalendarPayload).days;
          const map: Record<string, ListingDailyCalendarDay> = {};
          for (const row of days) {
            if (row?.date) map[row.date] = row;
          }
          setCalByYmd(map);
          void trackEvent("calendar_viewed", { listingId, start: startYmd, end: endYmd }).catch(() => {});
        })
        .catch(() => setCalByYmd({}))
        .finally(() => setCalLoading(false));
    },
    [listingId]
  );

  useEffect(() => {
    if (!listingId) return;
    loadCalendar(viewYearMonth.y, viewYearMonth.m);
  }, [listingId, viewYearMonth, loadCalendar]);

  useEffect(() => {
    if (!listingId) return;
    setAvailabilityLoaded(false);
    setNextAvailableIso(undefined);
    fetch(`/api/listings/${encodeURIComponent(listingId)}/availability`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: unknown) => {
        if (data && typeof data === "object" && "nextAvailableDate" in data) {
          const n = (data as { nextAvailableDate?: string | null }).nextAvailableDate;
          setNextAvailableIso(n ?? null);
        } else {
          setNextAvailableIso(null);
        }
      })
      .catch(() => setNextAvailableIso(null))
      .finally(() => setAvailabilityLoaded(true));
  }, [listingId]);

  useEffect(() => {
    if (!listingId) return;
    setError(null);
    fetch(`/api/listings/${listingId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data === "object" && typeof (data as { price?: number }).price === "number") {
          const o = data as { price: number; title?: string; city?: string };
          setListing({
            price: o.price,
            title: typeof o.title === "string" ? o.title : undefined,
            city: typeof o.city === "string" && o.city.trim() ? o.city : undefined,
          });
        } else {
          setListing(null);
        }
      })
      .catch(() => setListing(null));
  }, [listingId]);

  useEffect(() => {
    if (!listingId || !startDate || !endDate) {
      setDynamicQuote(null);
      return;
    }
    if (endDate <= startDate) {
      setDynamicQuote(null);
      return;
    }
    let cancel = false;
    setQuoteLoading(true);
    const u = new URLSearchParams({ listingId, startDate, endDate });
    fetch(`/api/bookings/quote?${u.toString()}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancel || !data?.breakdown) return;
        const b = data.breakdown as {
          nightlyPrices: { date: string; priceCents: number; reasons: string[] }[];
          subtotalCents: number;
          platformFeeCents: number;
          finalCents: number;
        };
        setDynamicQuote({
          nightlyPrices: b.nightlyPrices,
          subtotalCents: b.subtotalCents,
          platformFeeCents: b.platformFeeCents,
          finalCents: b.finalCents,
        });
      })
      .catch(() => {
        if (!cancel) setDynamicQuote(null);
      })
      .finally(() => {
        if (!cancel) setQuoteLoading(false);
      });
    return () => {
      cancel = true;
    };
  }, [listingId, startDate, endDate]);

  const { displayNights: nightsForUi, totalDisplay, pricePerNightDisplay } = useMemo(() => {
    if (!listing || !startDate || !endDate) {
      return { displayNights: 0, totalDisplay: "—", pricePerNightDisplay: 0 as number | null };
    }
    if (dynamicQuote) {
      const n = dynamicQuote.nightlyPrices.length;
      const totalDisplay = (dynamicQuote.finalCents / 100).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      });
      const avg = n > 0 ? dynamicQuote.subtotalCents / 100 / n : listing.price;
      return { displayNights: n, totalDisplay, pricePerNightDisplay: avg };
    }
    const start = dateFromYmd(startDate);
    const end = dateFromYmd(endDate);
    const n = stayNightsFromRange(start, end);
    const keys = nightYmdKeysForStay(startDate, endDate);
    const hasCal = calByYmd != null && Object.keys(calByYmd).length > 0;
    const subtotalDollars = hasCal
      ? keys.reduce((sum, ymd) => {
          const row = calByYmd![ymd];
          if (row?.suggestedPrice != null && !row.booked) return sum + row.suggestedPrice;
          return sum + listing.price;
        }, 0)
      : calculateTotalPrice(start, end, listing.price);
    const subtotalCents = Math.round(subtotalDollars * 100);
    const { finalCents } = totalWithPlatformFeeCents(subtotalCents);
    const totalDisplay = (finalCents / 100).toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    });
    const pricePerNightDisplay =
      hasCal && n > 0
        ? keys.reduce((sum, ymd) => {
            const row = calByYmd![ymd];
            if (row?.suggestedPrice != null && !row.booked) return sum + row.suggestedPrice;
            return sum + listing.price;
          }, 0) / n
        : listing.price;
    return { displayNights: n, totalDisplay, pricePerNightDisplay };
  }, [listing, startDate, endDate, calByYmd, dynamicQuote]);

  const suggestionList = useMemo((): { startDate: string; endDate: string }[] => {
    if (!conflictSuggestions) return [];
    if (conflictSuggestions.nearestRanges.length > 0) return conflictSuggestions.nearestRanges.slice(0, 3);
    if (conflictSuggestions.nextAvailableStart && startDate && endDate) {
      return [
        {
          startDate: conflictSuggestions.nextAvailableStart,
          endDate: endYmdForSameSpan(startDate, endDate, conflictSuggestions.nextAvailableStart),
        },
      ];
    }
    return [];
  }, [conflictSuggestions, startDate, endDate]);

  const similarListingsHref = useMemo(() => {
    const p = new URLSearchParams();
    if (listing?.city) p.set("city", listing.city);
    const s = error && rejectedAttempt ? rejectedAttempt.start : startDate;
    const e = error && rejectedAttempt ? rejectedAttempt.end : endDate;
    if (s && e) p.set("dates", `${s}..${e}`);
    const q = p.toString();
    return q ? `/listings?${q}` : "/listings";
  }, [listing?.city, startDate, endDate, error, rejectedAttempt]);

  function applyConflictSuggestion(sug: { startDate: string; endDate: string }) {
    const a = dateFromYmd(sug.startDate);
    const b = dateFromYmd(sug.endDate);
    setRange(a <= b ? [a, b] : [b, a]);
    setStartDate(sug.startDate);
    setEndDate(sug.endDate);
    setError(null);
    setConflictSuggestions(null);
    setRejectedAttempt(null);
    void trackEvent("booking_conflict_suggestion_clicked", {
      listingId,
      suggestedStart: sug.startDate,
      suggestedEnd: sug.endDate,
    }).catch(() => {});
  }

  async function handleBooking() {
    if (!listingId || !startDate || !endDate) {
      setError("Choose dates first.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          listingId,
          startDate,
          endDate,
        }),
      });

      const data = (await res.json()) as {
        error?: string;
        code?: string;
        id?: string;
        holdExpiresAt?: string | null;
        suggestions?: ConflictSug;
      };
      if (!res.ok) {
        if (res.status === 409 || data.code === "BOOKING_CONFLICT" || data.error === "Dates not available") {
          setRejectedAttempt({ start: startDate, end: endDate });
          setConflictSuggestions(
            data.suggestions
              ? {
                  nextAvailableStart: data.suggestions.nextAvailableStart ?? null,
                  nearestRanges: data.suggestions.nearestRanges ?? [],
                }
              : { nextAvailableStart: null, nearestRanges: [] }
          );
          setError("Some dates are already booked. Please select different dates.");
          void trackEvent("booking_conflict", { listingId, startDate, endDate }).catch(() => {});
        } else {
          setConflictSuggestions(null);
          setRejectedAttempt(null);
          setError(data.error || "Booking failed");
        }
        return;
      }

      setConflictSuggestions(null);
      setRejectedAttempt(null);
      setError(null);
      setHoldExpiresAt(typeof data.holdExpiresAt === "string" ? data.holdExpiresAt : null);

      if (!listing || !Number.isFinite(listing.price) || listing.price < 0) {
        setError("Listing price not available. Refresh and try again.");
        return;
      }

      const start = dateFromYmd(startDate);
      const end = dateFromYmd(endDate);
      const keys = nightYmdKeysForStay(startDate, endDate);
      const hasCal = calByYmd != null && Object.keys(calByYmd).length > 0;
      const subtotalDollars = hasCal
        ? keys.reduce((sum, ymd) => {
            const row = calByYmd![ymd];
            if (row?.suggestedPrice != null && !row.booked) return sum + row.suggestedPrice;
            return sum + listing.price;
          }, 0)
        : calculateTotalPrice(start, end, listing.price);
      const subtotalCents = Math.round(subtotalDollars * 100);
      const { finalCents } = totalWithPlatformFeeCents(subtotalCents);
      const amount = Math.max(50, dynamicQuote?.finalCents ?? finalCents);

      const base = typeof window !== "undefined" ? window.location.origin : "http://localhost:3001";
      const payment = await fetch("/api/checkout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          productName: `Stay (${startDate} → ${endDate})`,
          listingId,
          successUrl: `${base}/success?bookingId=${encodeURIComponent(data.id!)}`,
          cancelUrl: `${base}/cancel`,
          metadata: {
            bookingId: data.id,
            listingId,
            paymentType: "marketplace_listing_checkout",
          },
        }),
      });

      const checkout = await payment.json();
      if (!payment.ok || !checkout.url) {
        setError((checkout as { error?: string }).error || "Checkout failed");
        return;
      }

      window.location.href = checkout.url as string;
    } finally {
      setBusy(false);
    }
  }

  if (!listingId) {
    return (
      <div className="p-10">
        <p>Invalid listing.</p>
        <Link className="text-blue-600 underline" href="/listings">
          Back
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 dark:bg-zinc-950">
      <div className="mx-auto max-w-5xl">
        <nav className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          <Link className="hover:text-zinc-900 dark:hover:text-zinc-100" href={`/listings/${listingId}`}>
            ← Listing
          </Link>
          <span className="mx-2">·</span>
          <Link className="hover:text-zinc-900 dark:hover:text-zinc-100" href="/listings">
            All listings
          </Link>
        </nav>

        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          {listing?.title ? `Book: ${listing.title}` : "Book your stay"}
        </h1>

        <p className="mt-2 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
          Unavailable dates are greyed out. Your total uses daily dynamic pricing: weekend, season, city demand, and
          occupancy, plus a 10% platform fee at checkout.
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Prices are calculated daily based on demand, season, and availability. Final amount is set on the server when
          you pay.
        </p>

        <HelpBanner className="mt-6" />

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,400px)]">
          <div>
            {availabilityLoaded ? (
              <p
                className="mb-3 text-sm text-zinc-700 dark:text-zinc-300"
                data-testid="next-available-line"
                role="status"
              >
                {nextAvailableIso ? (
                  <>
                    <span className="text-zinc-500">Next available: </span>
                    {new Date(nextAvailableIso).toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric",
                    })}
                  </>
                ) : (
                  <span className="text-zinc-500">
                    No open check-in night in the next window — the calendar may be full; try a later month.
                  </span>
                )}
              </p>
            ) : (
              <p className="mb-3 text-sm text-zinc-500" role="status">
                Loading next available date…
              </p>
            )}
            <div
              className="relative max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
              data-testid="booking-calendar"
            >
              {calLoading ? (
                <p className="px-2 py-6 text-sm text-zinc-500" role="status">
                  Loading prices &amp; availability…
                </p>
              ) : null}
              <div className={calLoading ? "pointer-events-none opacity-40" : ""}>
                <Calendar
                  selectRange
                  value={range}
                  onActiveStartDateChange={({ activeStartDate }) => {
                    setViewYearMonth({ y: activeStartDate.getFullYear(), m: activeStartDate.getMonth() });
                  }}
                  onChange={(v) => {
                    if (Array.isArray(v) && v[0] && v[1]) {
                      const a = v[0];
                      const b = v[1];
                      const from = a < b ? a : b;
                      const to = a < b ? b : a;
                      if (rangeTouchesBooked(from, to, calByYmd)) {
                        setError("Some dates are not available. Please select a different range.");
                        setRange(null);
                        setStartDate("");
                        setEndDate("");
                        return;
                      }
                      setRange([from, to]);
                      setStartDate(toISODateLocal(from));
                      setEndDate(toISODateLocal(to));
                      setError(null);
                      setHoldExpiresAt(null);
                      setConflictSuggestions(null);
                      setRejectedAttempt(null);
                      const endClick = toISODateLocal(to);
                      const forTrack = calByYmd?.[endClick];
                      if (forTrack) {
                        void trackEvent("calendar_date_selected", {
                          listingId,
                          date: endClick,
                          suggestedPrice: forTrack.suggestedPrice,
                          demandLevel: forTrack.demandLevel,
                        }).catch(() => {});
                      }
                      return;
                    }
                    if (v instanceof Date) {
                      setRange(v);
                      setStartDate(toISODateLocal(v));
                      setEndDate(toISODateLocal(v));
                      setError(null);
                      setHoldExpiresAt(null);
                      setConflictSuggestions(null);
                      setRejectedAttempt(null);
                      const y = toISODateLocal(v);
                      const forTrack = calByYmd?.[y];
                      if (forTrack) {
                        void trackEvent("calendar_date_selected", {
                          listingId,
                          date: y,
                          suggestedPrice: forTrack.suggestedPrice,
                          demandLevel: forTrack.demandLevel,
                        }).catch(() => {});
                      }
                    }
                  }}
                  tileClassName={({ date, view }) => {
                    if (view !== "month") return null;
                    const ymd = toISODateLocal(date);
                    if (rejectedAttempt && ymdInInclusiveRange(ymd, rejectedAttempt.start, rejectedAttempt.end)) {
                      return "ring-1 ring-rose-300/60 bg-rose-50/30 dark:bg-rose-950/30 dark:ring-rose-500/30";
                    }
                    const day = calByYmd?.[ymd];
                    if (!day) return null;
                    if (day.booked) return "!cursor-not-allowed bg-zinc-200/90 dark:bg-zinc-800/90";
                    if (day.demandLevel === "high")
                      return "ring-1 ring-amber-400/50 bg-amber-50/40 dark:bg-amber-950/25";
                    if (day.demandLevel === "medium")
                      return "ring-1 ring-amber-200/40 bg-amber-50/20 dark:bg-amber-950/10";
                    return null;
                  }}
                  tileContent={({ date, view }) => {
                    if (view !== "month") return null;
                    const ymd = toISODateLocal(date);
                    const day = calByYmd?.[ymd];
                    if (rejectedAttempt && ymdInRejectedStayNights(ymd, rejectedAttempt.start, rejectedAttempt.end)) {
                      return (
                        <div className="mt-0.5 text-[10px] font-medium text-rose-800 dark:text-rose-200/90">
                          Unavailable
                        </div>
                      );
                    }
                    if (!day) return null;
                    if (day.booked) {
                      return (
                        <div className="mt-0.5 text-[10px] font-medium text-zinc-500 line-through decoration-zinc-400">
                          Booked
                        </div>
                      );
                    }
                    const s = day.suggestedPrice;
                    if (s == null) return null;
                    return (
                      <div className="mt-0.5 flex flex-col items-center gap-0.5 text-[10px] leading-tight text-zinc-600 dark:text-zinc-300">
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">
                          ${Number.isInteger(s) ? s : s.toFixed(0)}
                        </span>
                        {day.demandLevel === "high" ? (
                          <span className="font-medium text-amber-700 dark:text-amber-400">High demand</span>
                        ) : null}
                      </div>
                    );
                  }}
                  tileDisabled={({ date, view }) => {
                    if (view !== "month") return false;
                    return calByYmd?.[toISODateLocal(date)]?.booked ?? false;
                  }}
                />
              </div>
            </div>

            {error ? (
              <div
                className="mt-4 max-w-md rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200"
                role="alert"
              >
                {error}
              </div>
            ) : null}
            {error && rejectedAttempt && conflictSuggestions ? (
              <div className="mt-3 max-w-md space-y-3 text-sm text-zinc-700 dark:text-zinc-300">
                {suggestionList.length > 0 ? (
                  <>
                    <p className="font-medium text-zinc-800 dark:text-zinc-200">Try these dates instead:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestionList.map((s) => (
                        <button
                          key={`${s.startDate}-${s.endDate}`}
                          type="button"
                          onClick={() => applyConflictSuggestion(s)}
                          className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-left text-sm font-medium text-zinc-800 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:border-zinc-500"
                        >
                          {s.startDate.replace(/^\d{4}-/, "")} – {s.endDate.replace(/^\d{4}-/, "")}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-zinc-600 dark:text-zinc-400">No availability in the selected period.</p>
                )}
                <p>
                  <Link
                    href={similarListingsHref}
                    className="font-medium text-zinc-800 underline decoration-zinc-400 underline-offset-2 hover:text-zinc-950 dark:text-zinc-200 dark:hover:text-white"
                  >
                    View similar listings
                  </Link>
                </p>
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            {quoteLoading && startDate && endDate ? (
              <p className="text-sm text-zinc-500" role="status">
                Loading price quote…
              </p>
            ) : null}
            {dynamicQuote && !quoteLoading ? (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50/80 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900/50">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Price summary</h3>
                <ul className="mt-3 space-y-1.5 text-zinc-700 dark:text-zinc-300">
                  {dynamicQuote.nightlyPrices.map((line) => {
                    const label = new Date(line.date + "T12:00:00").toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    });
                    const rest =
                      line.reasons.length > 0 ? ` — ${line.reasons.slice(0, 2).join(", ")}` : "";
                    return (
                      <li key={line.date} className="flex justify-between gap-2 text-left">
                        <span>
                          {label}: ${(line.priceCents / 100).toFixed(0)}
                          <span className="text-zinc-500 dark:text-zinc-500">{rest}</span>
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-2 space-y-1 border-t border-zinc-200 pt-2 text-zinc-800 dark:border-zinc-700 dark:text-zinc-200">
                  <p className="flex justify-between">
                    <span>Subtotal</span>
                    <span>${(dynamicQuote.subtotalCents / 100).toFixed(0)}</span>
                  </p>
                  <p className="flex justify-between text-zinc-600 dark:text-zinc-400">
                    <span>Platform fee (10%)</span>
                    <span>${(dynamicQuote.platformFeeCents / 100).toFixed(0)}</span>
                  </p>
                  <p className="flex justify-between font-semibold">
                    <span>Total</span>
                    <span>{(dynamicQuote.finalCents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" })}</span>
                  </p>
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  Prices are calculated daily based on demand, season, and availability.
                </p>
              </div>
            ) : null}
            <BookingSummary
              from={startDate || "—"}
              to={endDate || "—"}
              nights={nightsForUi}
              pricePerNight={pricePerNightDisplay ?? 0}
              totalDisplay={totalDisplay}
              onConfirm={() => void handleBooking()}
              busy={busy}
              disabled={busy || !startDate || !endDate || !listing}
              holdExpiresAt={holdExpiresAt}
              showFlatBreakdown={!dynamicQuote}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
