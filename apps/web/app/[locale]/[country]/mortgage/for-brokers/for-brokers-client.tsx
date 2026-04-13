"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { BROKER_PLATFORM_PLANS } from "@/modules/mortgage/services/broker-platform-plans";

export function ForBrokersClient() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [errText, setErrText] = useState("");

  const submitFree = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setStatus("loading");
      setErrText("");
      try {
        const res = await fetch("/api/mortgage/broker-program/interest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            name: name || undefined,
            company: company || undefined,
            phone: phone || undefined,
            message: message || undefined,
            planSlug: "free",
          }),
        });
        const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; message?: string };
        if (!res.ok) {
          setErrText(j.error ?? "Could not submit.");
          setStatus("err");
          return;
        }
        setStatus("ok");
        setEmail("");
        setName("");
        setCompany("");
        setPhone("");
        setMessage("");
      } catch {
        setErrText("Network error. Try again.");
        setStatus("err");
      }
    },
    [email, name, company, phone, message]
  );

  return (
    <div className="mx-auto max-w-6xl space-y-16 px-4 py-12 sm:px-6">
      <header className="text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-premium-gold">Mortgage professionals</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Become a broker partner on LECIPM</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#B3B3B3]">
          Receive qualified financing leads from buyers and investors using our analyzer, mortgage hub, and marketplace.
          Choose a tier that matches your volume — start with a free program preview (no login), then upgrade to a paid plan
          for dashboard access, lead routing, and client contact tools.
        </p>
      </header>

      <section aria-labelledby="partner-plans">
        <h2 id="partner-plans" className="sr-only">
          Partner plans
        </h2>
        <div className="grid gap-6 lg:grid-cols-4">
          {BROKER_PLATFORM_PLANS.map((plan) => (
            <article
              key={plan.slug}
              className={`flex flex-col rounded-2xl border p-6 ${
                plan.highlighted
                  ? "border-premium-gold/50 bg-gradient-to-b from-[#1a1508] to-[#0B0B0B] shadow-[0_0_40px_rgba(212,175,55,0.12)]"
                  : "border-white/10 bg-[#121212]/80"
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-premium-gold/90">{plan.priceLabel}</p>
              <h3 className="mt-2 text-xl font-bold text-white">{plan.title}</h3>
              <p className="mt-1 text-sm text-[#9CA3AF]">{plan.subtitle}</p>
              <p className="mt-4 text-xs font-medium leading-snug text-[#D1D5DB]">{plan.leadSummary}</p>
              <ul className="mt-4 flex-1 space-y-2 text-xs text-[#9CA3AF]">
                {plan.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <span className="text-premium-gold" aria-hidden>
                      ✓
                    </span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                {plan.slug === "free" ? (
                  <a
                    href={plan.ctaHref}
                    className="flex min-h-[48px] w-full items-center justify-center rounded-xl border border-premium-gold/40 bg-black/30 px-4 py-3 text-sm font-bold text-premium-gold transition hover:bg-premium-gold/10"
                  >
                    {plan.ctaLabel}
                  </a>
                ) : (
                  <Link
                    href={plan.ctaHref}
                    className={`flex min-h-[48px] w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-bold transition ${
                      plan.highlighted
                        ? "bg-premium-gold text-[#0B0B0B] hover:brightness-110"
                        : "border border-white/20 text-white hover:bg-white/5"
                    }`}
                  >
                    {plan.ctaLabel}
                  </Link>
                )}
                {plan.requiresAccount ? (
                  <p className="mt-2 text-center text-[11px] text-[#6B7280]">
                    Already registered?{" "}
                    <Link href="/auth/login?next=/dashboard/expert/billing" className="text-premium-gold hover:underline">
                      Sign in
                    </Link>{" "}
                    → Billing
                  </p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section
        id="free-partner-form"
        className="scroll-mt-28 rounded-2xl border border-premium-gold/30 bg-[#14110a]/40 p-6 sm:p-10"
        aria-labelledby="free-form-title"
      >
        <h2 id="free-form-title" className="text-xl font-bold text-white">
          Partner preview — no account required
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-[#B3B3B3]">
          Tell us how to reach you. We&apos;ll send program terms, lead-quality notes, and onboarding steps. There is no
          automated lead inbox on this tier — upgrade to Gold or higher after signup to receive routed leads.
        </p>
        {status === "ok" ? (
          <p className="mt-6 rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100">
            Thanks — our partner team will reach out shortly with program details.
          </p>
        ) : (
          <form onSubmit={(e) => void submitFree(e)} className="mt-8 grid gap-4 sm:grid-cols-2">
            {errText ? (
              <p className="sm:col-span-2 text-sm text-red-400" role="alert">
                {errText}
              </p>
            ) : null}
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-premium-gold/90" htmlFor="fb-email">
                Work email *
              </label>
              <input
                id="fb-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-premium-gold/90" htmlFor="fb-name">
                Name
              </label>
              <input
                id="fb-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-premium-gold/90" htmlFor="fb-phone">
                Phone
              </label>
              <input
                id="fb-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2.5 text-sm text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-premium-gold/90" htmlFor="fb-co">
                Brokerage / brand
              </label>
              <input
                id="fb-co"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2.5 text-sm text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-semibold text-premium-gold/90" htmlFor="fb-msg">
                Message (optional)
              </label>
              <textarea
                id="fb-msg"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-3 py-2.5 text-sm text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={status === "loading"}
                className="min-h-[48px] rounded-xl bg-premium-gold px-8 py-3 text-sm font-extrabold text-[#0B0B0B] disabled:opacity-50"
              >
                {status === "loading" ? "Sending…" : "Request program info"}
              </button>
            </div>
          </form>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#121212]/60 p-6 text-sm text-[#B3B3B3]">
        <h2 className="text-lg font-semibold text-white">How lead routing works</h2>
        <ul className="mt-4 list-inside list-disc space-y-2">
          <li>Consumers submit mortgage intent through LECIPM — we score intent and assign to an available partner.</li>
          <li>Daily and monthly caps depend on your subscription tier (Gold → Ambassador).</li>
          <li>Highest-intent leads are reserved for Platinum+ and Ambassador partners.</li>
          <li>After signup, accept platform terms, then open Billing to activate Stripe subscription for your tier.</li>
        </ul>
        <p className="mt-6">
          <Link href="/mortgage" className="font-semibold text-premium-gold hover:underline">
            ← Back to public mortgage hub
          </Link>
        </p>
      </section>
    </div>
  );
}
