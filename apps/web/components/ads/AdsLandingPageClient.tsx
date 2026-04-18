"use client";

import * as React from "react";
import Link from "next/link";
import { PLATFORM_NAME } from "@/lib/brand/platform";
import type { LandingCopyBundle } from "@/modules/ads/landing-copy.service";

export type AdsLandingPreviewItem = {
  id: string;
  title: string;
  href: string;
  imageUrl: string | null;
  priceLabel: string;
};

type Props = {
  locale: string;
  country: string;
  landingType: "bnhub" | "host" | "buy";
  city: string;
  copy: LandingCopyBundle;
  stats: { label: string; value: string }[];
  listings: AdsLandingPreviewItem[];
  primaryHref: string;
  secondaryHref: string;
  /** Shown directly under primary CTAs — paid social trust line. */
  trustLine?: string;
};

function beacon(
  step: "landing_view" | "cta_click" | "listing_view" | "lead_submit",
  opts: { sessionId: string; path: string; listingId?: string; idempotencyKey?: string },
) {
  return fetch("/api/marketing-system/v2/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      kind: "funnel",
      step,
      sessionId: opts.sessionId,
      listingId: opts.listingId,
      idempotencyKey: opts.idempotencyKey,
      publicAdsLanding: true,
      meta: { path: opts.path, source: "ads_landing_beacon" },
    }),
  }).catch(() => {});
}

export function AdsLandingPageClient({
  locale,
  country,
  landingType,
  city,
  copy,
  stats,
  listings,
  primaryHref,
  secondaryHref,
  trustLine = "Secure payments • Verified users",
}: Props) {
  const path = `/${locale}/${country}/ads/${landingType}`;
  const [sessionId] = React.useState(() => {
    if (typeof window === "undefined") return "";
    let s = sessionStorage.getItem("lecipm_ads_session");
    if (!s) {
      s = crypto.randomUUID();
      sessionStorage.setItem("lecipm_ads_session", s);
    }
    return s;
  });

  React.useEffect(() => {
    if (typeof window === "undefined" || !sessionId) return;
    const fullPath = `${window.location.pathname}${window.location.search}`;
    const storageKey = `lecipm_ads_landing_view:${landingType}:${city}`;
    if (sessionStorage.getItem(storageKey)) return;
    sessionStorage.setItem(storageKey, "1");
    void beacon("landing_view", {
      sessionId,
      path: fullPath,
      idempotencyKey: `ads:lv:${sessionId}:${landingType}:${city}`,
    });
  }, [sessionId, landingType, city]);

  function onCta(kind: "primary" | "secondary", href: string) {
    const fullPath = typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : path;
    void beacon("cta_click", {
      sessionId,
      path: fullPath,
      idempotencyKey: `ads:cta:${kind}:${sessionId}:${href}:${Date.now()}`,
    });
  }

  return (
    <div className="bg-[#050505] text-white">
      <section className="border-b border-white/10 px-4 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400/90">{PLATFORM_NAME} · Ads</p>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{copy.headline}</h1>
          <p className="mt-4 text-base leading-relaxed text-zinc-400 sm:text-lg">{copy.subheadline}</p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Link
              href={primaryHref}
              onClick={() => onCta("primary", primaryHref)}
              className="inline-flex min-w-[200px] justify-center rounded-xl bg-emerald-500 px-8 py-3 text-sm font-bold text-[#051015] transition hover:brightness-110"
            >
              {copy.primaryCta}
            </Link>
            <Link
              href={secondaryHref}
              onClick={() => onCta("secondary", secondaryHref)}
              className="inline-flex min-w-[200px] justify-center rounded-xl border border-white/15 px-8 py-3 text-sm font-semibold text-white hover:border-emerald-400/40"
            >
              {copy.secondaryCta}
            </Link>
          </div>
          <p className="mt-5 text-sm font-medium text-zinc-300">{trustLine}</p>
          <p className="mt-6 text-xs text-zinc-500">
            {city} · UTM parameters from your ads are preserved when you land with <code className="text-zinc-400">?utm_*</code>{" "}
            query strings.
          </p>
        </div>
      </section>

      <section className="border-b border-white/10 px-4 py-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-sm font-semibold uppercase tracking-[0.2em] text-zinc-500">Trust & proof</h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3 text-xs text-zinc-400">
            <span className="rounded-full border border-white/10 px-3 py-1">LECIPM-operated marketplace</span>
            <span className="rounded-full border border-white/10 px-3 py-1">No auto-spend from these pages</span>
            <span className="rounded-full border border-white/10 px-3 py-1">Real listing rows from the database</span>
          </div>
          {stats.length > 0 ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {stats.map((s) => (
                <div key={s.label} className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3 text-center">
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="mt-1 text-xs text-zinc-500">{s.label}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="border-b border-white/10 px-4 py-12">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-lg font-semibold">Why LECIPM</h2>
          <ul className="mt-6 space-y-3 text-sm text-zinc-400">
            {copy.benefits.map((b) => (
              <li key={b} className="flex gap-2">
                <span className="text-emerald-400">✓</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-white/10 px-4 py-12">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-lg font-semibold">Live preview in {city}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-zinc-500">
            Pulled from published inventory where available — counts may be zero in new markets.
          </p>
          {listings.length === 0 ? (
            <p className="mt-8 text-center text-sm text-zinc-500">No rows to preview yet for this city filter.</p>
          ) : (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {listings.map((l) => (
                <ListingPreviewCard
                  key={l.id}
                  item={l}
                  sessionId={sessionId}
                  landingPath={path}
                  city={city}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="px-4 py-12" id="lead">
        <div className="mx-auto max-w-lg rounded-xl border border-zinc-800 bg-zinc-900/30 p-6">
          <h2 className="text-lg font-semibold">Get a callback</h2>
          <p className="mt-1 text-sm text-zinc-500">Optional — we create a real lead row in CRM when provided.</p>
          <AdsLeadForm landingType={landingType} sessionId={sessionId} city={city} />
        </div>
      </section>

      <section className="px-4 pb-16">
        <div className="mx-auto max-w-3xl text-center">
          <Link
            href={primaryHref}
            onClick={() => onCta("primary", primaryHref)}
            className="inline-flex min-w-[200px] justify-center rounded-xl bg-emerald-500 px-8 py-3 text-sm font-bold text-[#051015]"
          >
            {copy.primaryCta}
          </Link>
        </div>
      </section>
    </div>
  );
}

function ListingPreviewCard({
  item,
  sessionId,
  landingPath,
  city,
}: {
  item: AdsLandingPreviewItem;
  sessionId: string;
  landingPath: string;
  city: string;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [imgOk, setImgOk] = React.useState(true);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || !sessionId) return;
    const seenKey = `lecipm_li_view:${city}:${item.id}`;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          if (sessionStorage.getItem(seenKey)) return;
          sessionStorage.setItem(seenKey, "1");
          void beacon("listing_view", {
            sessionId,
            path: typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : landingPath,
            listingId: item.id,
            idempotencyKey: `ads:li:${sessionId}:${item.id}:${city}`,
          });
        }
      },
      { threshold: 0.35 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [item.id, sessionId, landingPath, city]);

  return (
    <div ref={ref} className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/60">
      <div className="aspect-[4/3] bg-zinc-800">
        {item.imageUrl && imgOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" className="h-full w-full object-cover" onError={() => setImgOk(false)} />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-zinc-600">Photo</div>
        )}
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-medium text-zinc-200">{item.title}</p>
        <p className="mt-1 text-xs text-emerald-400/90">{item.priceLabel}</p>
        <Link href={item.href} className="mt-2 inline-block text-xs font-semibold text-emerald-400 hover:underline">
          View →
        </Link>
      </div>
    </div>
  );
}

function AdsLeadForm({
  landingType,
  sessionId,
  city,
}: {
  landingType: "bnhub" | "host" | "buy";
  sessionId: string;
  city: string;
}) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [source, setSource] = React.useState<"facebook" | "google" | "other">("other");
  const [status, setStatus] = React.useState<"idle" | "loading" | "ok" | "err">("idle");
  const [err, setErr] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErr(null);
    try {
      const res = await fetch("/api/growth/leads/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publicAcquisition: true,
          name,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          message: message.trim() || undefined,
          source,
          campaignType: landingType,
          sessionId: sessionId || undefined,
          referrerUrl: typeof window !== "undefined" ? window.location.href : undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(data.error ?? "Request failed");
        setStatus("err");
        return;
      }
      const fullPath =
        typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "";
      const submitKey = `lecipm_ads_lead_submit:${sessionId}`;
      if (typeof window !== "undefined" && sessionId && !sessionStorage.getItem(submitKey)) {
        sessionStorage.setItem(submitKey, "1");
        void beacon("lead_submit", {
          sessionId,
          path: fullPath,
          idempotencyKey: `ads:lead_submit:${sessionId}:${landingType}:${city}`,
        });
      }
      setStatus("ok");
    } catch {
      setErr("Network error");
      setStatus("err");
    }
  }

  if (status === "ok") {
    return <p className="mt-4 text-sm text-emerald-400">Thanks — we recorded your request for {city}.</p>;
  }

  return (
    <form className="mt-4 space-y-3" onSubmit={onSubmit}>
      <input
        className="w-full rounded-lg border border-zinc-700 bg-black/40 px-3 py-2 text-sm"
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        className="w-full rounded-lg border border-zinc-700 bg-black/40 px-3 py-2 text-sm"
        placeholder="Email (optional if phone)"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="w-full rounded-lg border border-zinc-700 bg-black/40 px-3 py-2 text-sm"
        placeholder="Phone (optional if email)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <textarea
        className="w-full rounded-lg border border-zinc-700 bg-black/40 px-3 py-2 text-sm"
        placeholder="What are you looking for?"
        rows={3}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <label className="block text-xs text-zinc-500">
        Source
        <select
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-black/40 px-3 py-2 text-sm text-white"
          value={source}
          onChange={(e) => setSource(e.target.value as "facebook" | "google" | "other")}
        >
          <option value="facebook">Facebook / Instagram</option>
          <option value="google">Google Ads</option>
          <option value="other">Other</option>
        </select>
      </label>
      {err ? <p className="text-sm text-red-400">{err}</p> : null}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-xl bg-white/10 py-2 text-sm font-semibold text-white hover:bg-white/15 disabled:opacity-50"
      >
        {status === "loading" ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
