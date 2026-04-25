"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getTrackingSessionId, track } from "@/lib/tracking";

const PATH = "/bnhub/landing";
const META = { campaign: "bnhub_first100", funnel: "bnhub_marketing_v1", surface: "bnhub_landing" };

type Props = {
  searchMontrealHref: string;
  searchLavalHref: string;
  exampleListingHref: string;
  bookingDemoHref: string;
  hostOnboardingHref: string;
  referralCode: string | null;
};

export function BnhubMarketingLandingClient({
  searchMontrealHref,
  searchLavalHref,
  exampleListingHref,
  bookingDemoHref,
  hostOnboardingHref,
  referralCode,
}: Props) {
  const [email, setEmail] = useState("");
  const [city, setCity] = useState<"montreal" | "laval" | "other">("montreal");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const refFromUrl = useMemo(() => {
    if (typeof window === "undefined") return null;
    try {
      return new URLSearchParams(window.location.search).get("ref")?.trim().slice(0, 32) || null;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (refFromUrl) {
      try {
        window.localStorage.setItem("bnhub_ref_code", refFromUrl);
      } catch {
        /* ignore */
      }
    }
  }, [refFromUrl]);

  useEffect(() => {
    track("landing_view", {
      path: PATH,
      meta: { ...META, step: "landing" },
    });
  }, []);

  const fireCta = useCallback((ctaId: string, href?: string) => {
    track("cta_click", {
      path: PATH,
      meta: { ...META, ctaId, target: href ?? null },
    });
  }, []);

  const inviteUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    const origin = window.location.origin;
    const code = referralCode?.trim();
    return code ? `${origin}${PATH}?ref=${encodeURIComponent(code)}` : `${origin}${PATH}`;
  }, [referralCode]);

  async function onSubmitLead(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setMessage(null);
    let storedRef: string | null = refFromUrl;
    if (!storedRef && typeof window !== "undefined") {
      try {
        storedRef = window.localStorage.getItem("bnhub_ref_code")?.trim().slice(0, 32) ?? null;
      } catch {
        storedRef = null;
      }
    }
    try {
      const res = await fetch("/api/bnhub/marketing-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          city,
          referralCode: storedRef ?? undefined,
          sessionId: getTrackingSessionId(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; duplicate?: boolean };
      if (!res.ok) {
        setStatus("err");
        setMessage(data.error ?? "Something went wrong");
        return;
      }
      setStatus("ok");
      setMessage(data.duplicate ? "You’re already on the list." : "Thanks — you’re in.");
      track("cta_click", {
        path: PATH,
        meta: { ...META, ctaId: "lead_submit", city },
      });
    } catch {
      setStatus("err");
      setMessage("Network error — try again.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-rose-100 bg-gradient-to-b from-rose-50/80 to-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-rose-600">Montréal &amp; Laval</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Find safer, smarter stays
        </h1>
        <p className="mt-3 text-slate-600">
          Verified short-term stays with clear pricing — built for guests and hosts in Greater Montréal.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={searchMontrealHref}
            onClick={() => fireCta("search_now_montreal", searchMontrealHref)}
            className="inline-flex items-center justify-center rounded-full bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-rose-500"
          >
            Search now
          </Link>
          <Link
            href={searchLavalHref}
            onClick={() => fireCta("search_laval", searchLavalHref)}
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-800 hover:border-slate-300"
          >
            Search Laval
          </Link>
          <Link
            href={hostOnboardingHref}
            onClick={() => fireCta("host_cta", hostOnboardingHref)}
            className="inline-flex items-center justify-center rounded-full border border-transparent px-5 py-3 text-sm font-medium text-rose-700 hover:text-rose-800"
          >
            List your space
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Your path to a booking</h2>
        <ol className="mt-4 space-y-3 text-sm text-slate-700">
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
              1
            </span>
            <span>
              <strong className="text-slate-900">Landing</strong> — you are here.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-800">
              2
            </span>
            <span>
              <strong className="text-slate-900">Search</strong> —{" "}
              <Link
                href={searchMontrealHref}
                className="font-medium text-rose-600 hover:underline"
                onClick={() => fireCta("funnel_search", searchMontrealHref)}
              >
                browse stays
              </Link>
              .
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-800">
              3
            </span>
            <span>
              <strong className="text-slate-900">Listing</strong> —{" "}
              <Link
                href={exampleListingHref}
                className="font-medium text-rose-600 hover:underline"
                onClick={() => fireCta("funnel_listing", exampleListingHref)}
              >
                open a sample listing
              </Link>{" "}
              (or pick any result).
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-800">
              4
            </span>
            <span>
              <strong className="text-slate-900">Booking</strong> —{" "}
              <Link
                href={bookingDemoHref}
                className="font-medium text-rose-600 hover:underline"
                onClick={() => fireCta("funnel_booking", bookingDemoHref)}
              >
                complete checkout
              </Link>
              .
            </span>
          </li>
        </ol>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-slate-50/60 p-6">
        <h2 className="text-lg font-semibold text-slate-900">Get updates / deals</h2>
        <p className="mt-1 text-sm text-slate-600">Launch promos for Montréal &amp; Laval — no spam.</p>
        <form onSubmit={onSubmitLead} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <label className="flex-1 text-sm">
            <span className="sr-only">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-slate-900 outline-none ring-rose-500/30 focus:ring-2"
            />
          </label>
          <label className="text-sm sm:w-40">
            <span className="text-xs font-medium text-slate-500">Area</span>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value as typeof city)}
              className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-slate-900 outline-none ring-rose-500/30 focus:ring-2"
            >
              <option value="montreal">Montréal</option>
              <option value="laval">Laval</option>
              <option value="other">Other</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={status === "loading"}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {status === "loading" ? "…" : "Subscribe"}
          </button>
        </form>
        {message ? (
          <p className={`mt-3 text-sm ${status === "err" ? "text-red-600" : "text-emerald-700"}`}>{message}</p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Social traffic ideas</h2>
        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold text-rose-600">TikTok</h3>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
              <li>Top 3 stays in Montréal (hook in 2s, map + price)</li>
              <li>Best value Airbnb alternatives — BNHub walkthrough</li>
              <li>“We booked Laval under $X/night — here’s the unit”</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-rose-600">Instagram</h3>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
              <li>Carousel: Top 3 stays in Montréal</li>
              <li>Reels: Guest protection + verified host badges</li>
              <li>Story: Promo code + link in bio to this landing</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">Refer friends — earn credit</h2>
        <p className="mt-1 text-sm text-slate-600">
          Share your invite link. When a friend completes their first qualifying stay, both sides can receive
          platform credit (see program rules in host dashboard).
        </p>
        {referralCode ? (
          <div className="mt-4 space-y-2">
            <label className="text-xs font-medium text-slate-500">Your invite link</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                readOnly
                value={inviteUrl}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-800"
              />
              <button
                type="button"
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                onClick={() => {
                  void navigator.clipboard.writeText(inviteUrl);
                  fireCta("copy_invite");
                }}
              >
                Copy
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-600">
            <Link href="/en/ca/auth/login" className="font-medium text-rose-600 hover:underline">
              Sign in
            </Link>{" "}
            to generate a personal invite link and track rewards.
          </p>
        )}
      </section>

      <section className="rounded-2xl border border-amber-100 bg-amber-50/50 p-6">
        <h2 className="text-lg font-semibold text-slate-900">First-booking incentives</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-800">
          <li>
            <code className="rounded bg-white px-1.5 py-0.5 text-xs text-slate-900">BNHUBFIRST</code> — first
            booking discount (apply at checkout when enabled).
          </li>
          <li>
            <code className="rounded bg-white px-1.5 py-0.5 text-xs text-slate-900">MTL100</code> — Greater
            Montréal launch promo (subject to eligibility).
          </li>
        </ul>
        <p className="mt-3 text-xs text-slate-600">
          Codes are marketing targets for ops — wire to your promotion engine in admin when ready.
        </p>
      </section>

      <p className="text-center text-xs text-slate-500">
        <Link href="/bnhub" className="hover:text-slate-700">
          BNHub home
        </Link>
        {" · "}
        <Link href="/en/ca/search/bnhub" className="hover:text-slate-700">
          All stays
        </Link>
      </p>
    </div>
  );
}
