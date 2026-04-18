"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { PLATFORM_NAME } from "@/lib/brand/platform";
import { getContactMailtoHref, getSupportPhoneDisplay, getSupportTelHref } from "@/lib/config/contact";
import {
  recordFormStart,
  recordFormSubmit,
  recordLandingView,
} from "@/modules/growth/simple-conversion-tracker";
import { buildInstantValueSummary } from "@/modules/conversion/instant-value.service";
import {
  recordConversionSurfaceView,
  recordLeadFormStart,
  recordLeadSubmit,
} from "@/modules/conversion/conversion-monitoring.service";
import {
  recordGetLeadsFormStartFunnel,
  recordGetLeadsPageViewOnce,
  recordGetLeadsSubmitFunnel,
} from "@/modules/conversion/funnel-metrics.service";
import {
  getLeadsSubmitButtonLabel,
  getLeadsSubmitCtaVariant,
  type ConversionAbVariant,
} from "@/lib/conversion/conversion-ab-variant";
import { TrustStrip } from "@/components/shared/TrustStrip";
import { IntentSelector } from "@/components/shared/IntentSelector";
import type { InstantValueIntent } from "@/modules/conversion/instant-value.types";
import { LeadDisclaimer } from "@/components/legal/LeadDisclaimer";
import { BrokerLeadTrustStrip } from "@/components/legal/BrokerLeadTrustStrip";
import type { ConversionExperienceTier } from "@/modules/conversion/conversion-rollout-helpers";
import { ConversionMonitoringLivePanel } from "@/components/conversion/ConversionMonitoringLivePanel";

type Status = "idle" | "submitting" | "analyzing" | "success" | "error";

const INTENTS = [
  { id: "buy" as const, label: "Buy" },
  { id: "rent" as const, label: "Rent" },
  { id: "invest" as const, label: "Invest" },
  { id: "host" as const, label: "Host (BNHub)" },
];

export type LeadIntentId = (typeof INTENTS)[number]["id"];

export type GetLeadsUtm = {
  utm_source?: string;
  utm_campaign?: string;
  utm_medium?: string;
};

function parsePhoneOrEmail(raw: string): { email?: string; phone?: string } {
  const t = raw.trim();
  if (!t) return {};
  if (/^\S+@\S+\.\S+$/.test(t)) return { email: t.toLowerCase() };
  return { phone: t.slice(0, 40) };
}

function toInstantIntent(id: LeadIntentId): InstantValueIntent {
  return id;
}

type ScarcityLines = {
  leadsAvailableLine: string;
  brokersViewedLine: string;
};

type Props = {
  whatsappUrl?: string | null;
  utm?: GetLeadsUtm;
  /** FEATURE_GROWTH_SCALE_V1 — stronger CTA + scarcity copy (additive). */
  scaleInboundV1?: boolean;
  scarcity?: ScarcityLines | null;
  /** Conversion engine — UX + copy layers (default off). */
  conversionUpgradeV1?: boolean;
  /** Rich instant-value insight blocks (default off). */
  instantValueV1?: boolean;
  /** Server-derived rollout tier key (debug / clarity). */
  conversionTierKey?: ConversionExperienceTier;
  conversionTierLabel?: string;
  /** Dev/QA: show flag + tier strip (env or `?conversion_debug=1`). */
  conversionDebugUi?: boolean;
  /** Dev/QA: floating in-tab monitoring HUD. */
  showConversionMonitoringPanel?: boolean;
  /** URL `?intent=` — buy | rent | invest | host */
  initialIntent?: LeadIntentId | null;
  /** URL `?q=` or `?city=` — optional note prefill (non-binding). */
  locationHint?: string | null;
};

const gold = "#D4AF37";
const btnPrimary =
  "w-full min-h-[52px] rounded-xl bg-[#D4AF37] px-5 py-4 text-base font-semibold text-black transition hover:brightness-110 active:brightness-95 disabled:opacity-60";

const inputClass =
  "w-full rounded-xl border border-gray-800 bg-black px-4 py-3.5 text-base text-white placeholder:text-gray-500 focus:border-[#D4AF37]/60 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/25 disabled:opacity-60";

/**
 * /get-leads landing — POST /api/growth/early-leads (field names + endpoint unchanged).
 * Intent is sent in `notes` + `propertyLinkOrAddress` text (API metadata only allows utm_* keys).
 */
export function GetLeadsPageClient({
  whatsappUrl,
  utm,
  scaleInboundV1,
  scarcity,
  conversionUpgradeV1 = false,
  instantValueV1 = false,
  conversionTierKey,
  conversionTierLabel,
  conversionDebugUi = false,
  showConversionMonitoringPanel = false,
  initialIntent = null,
  locationHint = null,
}: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [intent, setIntent] = useState<LeadIntentId>(initialIntent ?? "buy");
  const [formStep, setFormStep] = useState<1 | 2>(1);
  const [ctaVariant, setCtaVariant] = useState<ConversionAbVariant>("a");
  const [showStayNudge, setShowStayNudge] = useState(false);
  const [listingClickCount, setListingClickCount] = useState(0);

  const ensuredStartRef = useRef(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const ivSummary = useMemo(() => {
    if (!conversionUpgradeV1) return null;
    const full = buildInstantValueSummary({ page: "leads", intent: toInstantIntent(intent) });
    if (!instantValueV1) return { ...full, insights: [] };
    return full;
  }, [conversionUpgradeV1, instantValueV1, intent]);

  useEffect(() => {
    recordLandingView();
    recordGetLeadsPageViewOnce();
  }, []);

  useEffect(() => {
    if (conversionUpgradeV1) recordConversionSurfaceView("get-leads");
  }, [conversionUpgradeV1]);

  useEffect(() => {
    setCtaVariant(getLeadsSubmitCtaVariant());
  }, []);

  useEffect(() => {
    try {
      const n = Number.parseInt(sessionStorage.getItem("conv:listing_clicks") ?? "0", 10);
      setListingClickCount(Number.isFinite(n) ? n : 0);
    } catch {
      setListingClickCount(0);
    }
  }, []);

  useEffect(() => {
    try {
      const last = sessionStorage.getItem("growth:last_lead_intent");
      if (last === "buy" || last === "rent" || last === "invest" || last === "host") {
        setIntent(last);
        setFormStep(2);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (initialIntent === "buy" || initialIntent === "rent" || initialIntent === "invest" || initialIntent === "host") {
      setIntent(initialIntent);
      if (locationHint?.trim()) setFormStep(2);
    }
  }, [initialIntent, locationHint]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const t = window.setTimeout(() => setShowStayNudge(true), 12500);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (formStep === 2) {
      window.requestAnimationFrame(() => nameInputRef.current?.focus());
    }
  }, [formStep]);

  const ensureFormStartTracked = useCallback(() => {
    if (ensuredStartRef.current) return;
    ensuredStartRef.current = true;
    const v = getLeadsSubmitCtaVariant();
    recordGetLeadsFormStartFunnel(v);
    recordFormStart();
    if (conversionUpgradeV1) recordLeadFormStart({ surface: "get-leads", intent });
  }, [conversionUpgradeV1, intent]);

  const advanceToContactStep = useCallback(() => {
    setFormStep(2);
    ensureFormStartTracked();
  }, [ensureFormStartTracked]);

  const scrollToForm = useCallback(() => {
    document.getElementById("lead-form")?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const intentLabel = INTENTS.find((x) => x.id === intent)?.label ?? "Buy";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");
    setStatus("submitting");
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const contact = String(fd.get("contact") ?? "").trim();
    let message = String(fd.get("notes") ?? "").trim();
    if (!message && locationHint?.trim()) {
      message = `Area focus: ${locationHint.trim().slice(0, 280)}`;
    }

    const propertyLinkOrAddress = `LECIPM contact | ${intentLabel}`;
    const intentForNotes = `Intent: ${intentLabel}`;
    const urgency =
      /\b(urgent|asap|today|now|immediately|emergency)\b/i.test(message) ||
      /\b(urgent|asap|today|now)\b/i.test(name)
        ? "\nFollow-up tag: hot (urgency keywords)"
        : "";
    const sourceLine = [utm?.utm_source, utm?.utm_campaign].filter(Boolean).length
      ? `\nSource: ${[utm?.utm_source, utm?.utm_medium, utm?.utm_campaign].filter(Boolean).join(" · ")}`
      : "";
    const notesCombined = [intentForNotes, message || null, urgency || null, sourceLine || null]
      .filter(Boolean)
      .join("\n\n");

    if (!name) {
      setStatus("error");
      setErrorMsg("Please add your name.");
      return;
    }
    const { email, phone } = parsePhoneOrEmail(contact);
    if (!email && !phone) {
      setStatus("error");
      setErrorMsg("Please add an email or phone number.");
      return;
    }

    const metadata: { utm_source?: string; utm_campaign?: string; utm_medium?: string } = {};
    if (utm?.utm_source) metadata.utm_source = utm.utm_source;
    if (utm?.utm_campaign) metadata.utm_campaign = utm.utm_campaign;
    if (utm?.utm_medium) metadata.utm_medium = utm.utm_medium;

    try {
      const res = await fetch("/api/growth/early-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: email || undefined,
          phone: phone || undefined,
          propertyLinkOrAddress,
          notes: notesCombined,
          ...(Object.keys(metadata).length ? { metadata } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(typeof data.error === "string" ? data.error : "Something went wrong.");
        return;
      }
      recordFormSubmit();
      recordGetLeadsSubmitFunnel(ctaVariant);
      if (conversionUpgradeV1) recordLeadSubmit({ surface: "get-leads", intent });
      try {
        sessionStorage.setItem("growth:last_lead_intent", intent);
      } catch {
        /* ignore */
      }
      e.currentTarget.reset();
      setIntent("buy");
      setFormStep(1);
      ensuredStartRef.current = false;
      setStatus("analyzing");
      window.setTimeout(() => {
        setStatus("success");
      }, 800);
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Try again.");
    }
  }

  const telHref = getSupportTelHref();
  const telDisplay = getSupportPhoneDisplay();
  const mailHref = getContactMailtoHref();

  const submitPrimaryLabel =
    listingClickCount >= 2 ? "Talk to someone now — get matched" : getLeadsSubmitButtonLabel(ctaVariant);

  return (
    <main className="min-h-screen bg-black text-white">
      {/* HERO */}
      <section className="mx-auto max-w-4xl px-4 py-10 text-center sm:px-6 sm:py-12">
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl">
          {conversionUpgradeV1 && ivSummary
            ? ivSummary.headline
            : scaleInboundV1
              ? "Get matched today — Québec real estate intake"
              : "Get matched with the right real estate opportunity"}
        </h1>
        <p className="mt-4 text-lg leading-snug text-gray-300 sm:text-xl">
          {conversionUpgradeV1 && ivSummary
            ? ivSummary.subheadline
            : scaleInboundV1
              ? "One short form. We route serious buyers & hosts to verified opportunities — you stay in control."
              : "Verified listings. Real opportunities. No pressure."}
        </p>
        <p className="mt-3 text-sm font-medium text-[#D4AF37]/90">
          {conversionUpgradeV1
            ? "Clear next step: intent → contact → we route you to matching inventory."
            : scaleInboundV1
              ? "⏱ Same-day routing on business days — submit before slots fill."
              : "Tell us what you need — we match when suitable listings and capacity align."}
        </p>
        {conversionDebugUi ? (
          <div className="mx-auto mt-4 max-w-2xl rounded-xl border border-cyan-900/50 bg-cyan-950/25 px-4 py-3 text-left text-[11px] leading-snug text-cyan-100/95">
            <p className="font-semibold text-cyan-200">Conversion rollout (internal)</p>
            <p className="mt-1 font-mono text-[10px] text-cyan-100/80">
              FEATURE_CONVERSION_UPGRADE_V1={String(conversionUpgradeV1)} · FEATURE_INSTANT_VALUE_V1=
              {String(instantValueV1)} · tier={conversionTierKey ?? "—"}
            </p>
            {conversionTierLabel ? <p className="mt-2 text-slate-300">{conversionTierLabel}</p> : null}
          </div>
        ) : null}
        {conversionUpgradeV1 && !instantValueV1 ? (
          <p className="mx-auto mt-5 max-w-xl text-center text-xs leading-relaxed text-slate-500">
            Insight tiles use <span className="font-mono text-slate-400">FEATURE_INSTANT_VALUE_V1</span> — off means a
            tighter hero without the three-card insight row; trust strip and form below stay the same.
          </p>
        ) : null}
        {scaleInboundV1 && scarcity ? (
          <p className="mx-auto mt-3 max-w-xl text-xs leading-relaxed text-amber-200/90">{scarcity.leadsAvailableLine}</p>
        ) : null}

        <button type="button" onClick={scrollToForm} className={`${btnPrimary} mx-auto mt-8 block max-w-md shadow-none`}>
          {ivSummary?.ctaLabel ??
            (scaleInboundV1 ? "Start my match — free intake" : "Get matched with properties now")}
        </button>
        {conversionUpgradeV1 ? (
          <div className="mx-auto mt-5 max-w-xl">
            <TrustStrip lines={ivSummary?.trustLines} />
          </div>
        ) : null}
        {conversionUpgradeV1 && instantValueV1 && ivSummary && ivSummary.insights.length > 0 ? (
          <ul className="mx-auto mt-8 max-w-2xl space-y-2 text-left text-sm text-gray-300">
            {ivSummary.insights.slice(0, 3).map((i) => (
              <li key={i.id} className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3">
                <span className="font-semibold text-[#D4AF37]">{i.title}</span>
                <span className="mt-1 block text-xs text-gray-400">{i.description}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {/* Short value strip */}
      {!conversionUpgradeV1 ? (
        <section className="mx-auto max-w-lg px-4 pb-8 text-center sm:px-6" aria-label="Trust">
          <ul className="flex flex-col items-center gap-1.5 text-sm text-gray-400 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-4">
            <li>✔ Verified listings only</li>
            <li>✔ No hidden fees</li>
            <li>✔ Direct access to deals</li>
          </ul>
        </section>
      ) : null}

      {/* HOW IT WORKS — compact */}
      <section className="mx-auto max-w-4xl px-4 py-8 text-center sm:px-6 sm:py-10">
        <h2 className="text-lg font-semibold text-white sm:text-xl">How it works</h2>
        <div className="mx-auto mt-6 grid max-w-2xl gap-6 text-gray-300 sm:grid-cols-3 sm:gap-4">
          <div>
            <div className="mb-1.5 text-2xl font-bold sm:text-3xl" style={{ color: gold }}>
              1
            </div>
            <p className="text-sm sm:text-base">Tell us your intent</p>
          </div>
          <div>
            <div className="mb-1.5 text-2xl font-bold sm:text-3xl" style={{ color: gold }}>
              2
            </div>
            <p className="text-sm sm:text-base">We route your request</p>
          </div>
          <div>
            <div className="mb-1.5 text-2xl font-bold sm:text-3xl" style={{ color: gold }}>
              3
            </div>
            <p className="text-sm sm:text-base">Get matched to opportunities</p>
          </div>
        </div>
        <button type="button" onClick={scrollToForm} className={`${btnPrimary} mx-auto mt-8 block max-w-md shadow-none`}>
          Get matched with properties now
        </button>
      </section>

      {/* CONTACT MODULE */}
      <section
        id="lead-form"
        className="mx-auto max-w-md scroll-mt-6 px-4 py-16 sm:px-6"
        aria-labelledby="lead-form-title"
      >
        <h2 id="lead-form-title" className="text-center text-xl font-semibold leading-snug sm:text-2xl">
          {scaleInboundV1 ? "Tell us what you need — fast" : "Tell us what you're looking for"}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          {scaleInboundV1
            ? "Goal first · contact second · optional notes. No spam · Free · Fast reply."
            : "Verified listings. Real opportunities. No pressure."}
        </p>
        {scaleInboundV1 && scarcity ? (
          <p className="mx-auto mt-2 max-w-md text-center text-[11px] leading-relaxed text-gray-500">
            {scarcity.brokersViewedLine}
          </p>
        ) : null}

        {status === "success" ? (
          <p
            className={`mt-8 px-4 py-5 text-center text-sm leading-relaxed ${
              conversionUpgradeV1
                ? "rounded-2xl border border-premium-gold/40 bg-gradient-to-br from-emerald-950/50 to-black text-emerald-50 shadow-[0_0_40px_-12px_rgba(212,175,55,0.35)]"
                : "rounded-xl border border-emerald-500/35 bg-emerald-950/30 text-emerald-100"
            }`}
            role="status"
          >
            {conversionUpgradeV1 ? (
              <>
                <span className="block text-base font-semibold text-premium-gold">You&apos;re in the queue</span>
                <span className="mt-2 block text-gray-300">
                  We&apos;re reviewing your intake and will route you to matching opportunities — no spam, no obligation.
                </span>
              </>
            ) : (
              <>✅ We&apos;re analyzing your request and matching you with the best opportunities.</>
            )}
          </p>
        ) : (
          <>
            {listingClickCount >= 2 ? (
              <div className="mt-6 rounded-xl border border-amber-500/35 bg-amber-950/30 px-4 py-3 text-center text-sm text-amber-100">
                You&apos;ve opened several listings — add your contact and we&apos;ll help shortlist what fits.
              </div>
            ) : null}

            {formStep === 1 ? (
              <div className="mt-8">
                <p className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-gray-500">
                  What are you looking for?
                </p>
                {conversionUpgradeV1 ? (
                  <IntentSelector
                    value={toInstantIntent(intent)}
                    onChange={(next) => setIntent(next as LeadIntentId)}
                  />
                ) : (
                  <div className="flex flex-wrap justify-center gap-2" role="group" aria-label="Intent">
                    {INTENTS.map((opt) => {
                      const selected = intent === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setIntent(opt.id)}
                          className={`min-h-[44px] rounded-full border px-4 py-2.5 text-sm font-medium transition ${
                            selected
                              ? "border-[#D4AF37] bg-[#D4AF37]/15 text-[#D4AF37]"
                              : "border-gray-800 bg-black text-gray-300 hover:border-gray-600"
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                )}
                <button
                  type="button"
                  onClick={advanceToContactStep}
                  className={`${btnPrimary} mt-8 w-full`}
                >
                  Continue — add contact details
                </button>
                <p className="mt-3 text-center text-[11px] text-slate-500">No spam · Free · Fast reply</p>
                <p className="mt-3 text-center text-[11px] leading-relaxed text-gray-500">
                  {intent === "buy" ? (
                    <>
                      Next:{" "}
                      <Link href="/listings" className="font-medium text-[#D4AF37] underline-offset-2 hover:underline">
                        Browse listings
                      </Link>{" "}
                      ·{" "}
                      <Link href="/evaluate" className="font-medium text-[#D4AF37] underline-offset-2 hover:underline">
                        Investment analysis
                      </Link>
                    </>
                  ) : null}
                  {intent === "rent" ? (
                    <>
                      Next:{" "}
                      <Link
                        href="/listings?dealType=RENT"
                        className="font-medium text-[#D4AF37] underline-offset-2 hover:underline"
                      >
                        Long-term rentals
                      </Link>
                    </>
                  ) : null}
                  {intent === "invest" ? (
                    <>
                      Next:{" "}
                      <Link href="/evaluate" className="font-medium text-[#D4AF37] underline-offset-2 hover:underline">
                        Run investment analysis
                      </Link>
                    </>
                  ) : null}
                  {intent === "host" ? (
                    <>
                      Next:{" "}
                      <Link href="/bnhub" className="font-medium text-[#D4AF37] underline-offset-2 hover:underline">
                        BNHub stays
                      </Link>{" "}
                      ·{" "}
                      <Link
                        href="/bnhub/host/dashboard"
                        className="font-medium text-[#D4AF37] underline-offset-2 hover:underline"
                      >
                        Host dashboard
                      </Link>
                    </>
                  ) : null}
                </p>
              </div>
            ) : null}

            {formStep === 2 ? (
              <form className="mt-8 space-y-4" onSubmit={onSubmit}>
                <input
                  ref={nameInputRef}
                  name="name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Your name"
                  disabled={status === "submitting" || status === "analyzing"}
                  onFocus={() => ensureFormStartTracked()}
                  className={inputClass}
                />

                <input
                  name="contact"
                  type="text"
                  required
                  autoComplete="email"
                  placeholder="Best way to contact you (phone or email)"
                  disabled={status === "submitting" || status === "analyzing"}
                  onFocus={() => ensureFormStartTracked()}
                  className={inputClass}
                />

                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={locationHint?.trim() ? `Area focus: ${locationHint.trim().slice(0, 280)}` : undefined}
                  placeholder="Optional message (area, budget, timing…)"
                  disabled={status === "submitting" || status === "analyzing"}
                  onFocus={() => ensureFormStartTracked()}
                  className={`${inputClass} resize-y min-h-[96px]`}
                />

                {status === "error" && errorMsg ? (
                  <p className="text-sm text-red-400" role="alert">
                    {errorMsg}
                  </p>
                ) : null}

                <p className="text-center text-[11px] text-slate-500">No spam · Free · Fast reply</p>

                <button
                  type="submit"
                  disabled={status === "submitting" || status === "analyzing"}
                  className={btnPrimary}
                  aria-busy={status === "submitting" || status === "analyzing"}
                >
                  {status === "submitting"
                    ? "Matching you..."
                    : status === "analyzing"
                      ? "Analyzing…"
                      : submitPrimaryLabel}
                </button>

                <div className="mt-4 space-y-3">
                  <BrokerLeadTrustStrip className="text-center sm:text-left" />
                  <LeadDisclaimer variant="compact" className="mx-auto max-w-lg" />
                </div>

                <ul className="space-y-1.5 pt-2 text-center text-xs leading-relaxed text-gray-400">
                  <li>✔ Verified listings only</li>
                  <li>✔ No hidden fees</li>
                  <li>✔ Real opportunities, not spam</li>
                  <li>✔ Direct access to deals</li>
                </ul>

                <p className="pt-2 text-center text-xs text-gray-500">
                  By continuing, you agree to our{" "}
                  <Link href="/en/ca/legal/terms" className="text-[#D4AF37] underline-offset-2 hover:underline">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/en/ca/legal/privacy" className="text-[#D4AF37] underline-offset-2 hover:underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </form>
            ) : null}
          </>
        )}

        {/* Multi-contact */}
        <div className="mt-10 border-t border-gray-800 pt-8">
          <p className="text-center text-sm font-medium text-gray-400">Prefer instant contact?</p>
          <ul className="mt-4 flex flex-col items-center gap-3 text-sm">
            {whatsappUrl ? (
              <li>
                <a
                  href={whatsappUrl}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-gray-800 px-5 py-3 font-medium text-[#D4AF37] hover:border-[#D4AF37]/50"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp
                </a>
              </li>
            ) : null}
            <li>
              <a
                href={telHref}
                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-gray-800 px-5 py-3 font-medium text-[#D4AF37] hover:border-[#D4AF37]/50"
              >
                Call now · {telDisplay}
              </a>
            </li>
            <li>
              <a
                href={mailHref}
                className="inline-flex min-h-[44px] items-center justify-center text-[#D4AF37] underline-offset-2 hover:underline"
              >
                Email us
              </a>
            </li>
          </ul>
        </div>
      </section>

      {showStayNudge && status !== "success" ? (
        <div
          className="fixed bottom-4 left-4 right-4 z-[55] mx-auto flex max-w-lg flex-col gap-2 rounded-xl border border-[#D4AF37]/40 bg-black/95 px-4 py-3 text-sm text-white shadow-xl sm:flex-row sm:items-center sm:justify-between"
          role="dialog"
          aria-label="Browse more opportunities"
        >
          <p className="text-center sm:text-left">Want similar opportunities?</p>
          <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
            <Link
              href="/listings"
              className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10"
            >
              Browse listings
            </Link>
            <button
              type="button"
              onClick={() => {
                setShowStayNudge(false);
                scrollToForm();
              }}
              className="rounded-lg bg-[#D4AF37] px-3 py-1.5 text-xs font-bold text-black hover:brightness-110"
            >
              Finish intake
            </button>
            <button
              type="button"
              onClick={() => setShowStayNudge(false)}
              className="text-xs text-slate-400 underline-offset-2 hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      <footer className="pb-12 text-center text-sm text-gray-500">© {PLATFORM_NAME}</footer>

      {showConversionMonitoringPanel ? <ConversionMonitoringLivePanel /> : null}
    </main>
  );
}
