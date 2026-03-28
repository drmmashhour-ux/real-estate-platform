"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CONTACT_EMAIL, getBrokerTelHref, getContactWhatsAppUrl } from "@/lib/config/contact";
import { LeadCTA } from "@/components/ui/LeadCTA";
import { HintTooltip } from "@/components/ui/HintTooltip";
import { track, TrackingEvent, getTrackingSessionId } from "@/lib/tracking";

type Status = "idle" | "submitting" | "success" | "error";

const PROPERTY_TYPES = [
  { value: "", label: "Select type" },
  { value: "House", label: "House" },
  { value: "Condo", label: "Condo" },
  { value: "Townhouse", label: "Townhouse" },
  { value: "Duplex / Triplex", label: "Duplex / Triplex" },
  { value: "Land / Lot", label: "Land / Lot" },
  { value: "Other", label: "Other" },
];

const CITY_OPTIONS = [
  { value: "", label: "Select city" },
  { value: "Montreal", label: "Montreal" },
  { value: "Laval", label: "Laval" },
  { value: "Quebec", label: "Quebec" },
];

const CONDITIONS = [
  { value: "", label: "Optional — select condition" },
  { value: "Excellent", label: "Excellent / like new" },
  { value: "Good", label: "Good" },
  { value: "Fair", label: "Fair" },
  { value: "Needs work", label: "Needs renovation" },
];

const EVAL_WA_MESSAGE =
  "Hello — I used the free property evaluation on LECIPM and would like to connect with a broker.";

function trackEngagement(
  leadId: string | null,
  eventType: "consultation_cta" | "call" | "whatsapp" | "broker_card"
) {
  if (!leadId) return;
  void fetch("/api/public/lead-activity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ leadId, eventType }),
  }).catch(() => {});
}

/** Analytics + optional lead-attributed activity (after submit). */
function trackEvaluateCta(
  leadId: string | null,
  kind: "call" | "whatsapp" | "consultation_cta" | "broker_card"
) {
  const section = leadId ? "result" : "above_fold";
  if (kind === "call") {
    track(TrackingEvent.CALL_CLICKED, {
      meta: { ctaKind: "evaluate_flow", section, leadId: leadId ?? undefined },
    });
    if (leadId) trackEngagement(leadId, "call");
  } else if (kind === "whatsapp") {
    track(TrackingEvent.WHATSAPP_CLICKED, {
      meta: { ctaKind: "evaluate_flow", section, leadId: leadId ?? undefined },
    });
    if (leadId) trackEngagement(leadId, "whatsapp");
  } else if (kind === "consultation_cta") {
    track(TrackingEvent.CTA_CLICKED, {
      meta: {
        ctaKind: "consultation",
        label: "Get consultation",
        leadId: leadId ?? undefined,
        href: "/sell#sell-consultation",
      },
    });
    if (leadId) trackEngagement(leadId, "consultation_cta");
  } else {
    track(TrackingEvent.CTA_CLICKED, {
      meta: { ctaKind: "broker_card", section, leadId: leadId ?? undefined },
    });
    if (leadId) trackEngagement(leadId, "broker_card");
  }
}

export function EvaluateClient() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [estimated, setEstimated] = useState<number | null>(null);
  const [rangeMin, setRangeMin] = useState<number | null>(null);
  const [rangeMax, setRangeMax] = useState<number | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const evalStartedSent = useRef(false);

  useEffect(() => {
    if (evalStartedSent.current) return;
    evalStartedSent.current = true;
    track(TrackingEvent.EVALUATION_STARTED, { path: "/evaluate" });
  }, []);

  useEffect(() => {
    if (status !== "success" || !leadId) return;
    void fetch("/api/public/lead-activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, eventType: "evaluation_result_view" }),
    }).catch(() => {});
  }, [status, leadId]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg("");
    setStatus("submitting");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const email = String(fd.get("email") ?? "").trim();
    if (!email) {
      setStatus("error");
      setErrorMsg("Email is required.");
      return;
    }

    const payload = {
      email,
      address: String(fd.get("address") ?? "").trim(),
      city: String(fd.get("city") ?? "").trim(),
      propertyType: String(fd.get("propertyType") ?? "").trim(),
      bedrooms: Number(fd.get("bedrooms")),
      bathrooms: Number(fd.get("bathrooms")),
      surfaceSqft: Number(fd.get("surfaceSqft")),
      condition: String(fd.get("condition") ?? "").trim() || undefined,
      trackingSessionId: getTrackingSessionId() ?? undefined,
    };

    try {
      const res = await fetch("/api/evaluation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setErrorMsg(typeof data.error === "string" ? data.error : "Something went wrong.");
        return;
      }
      const v = data.valuation;
      const main =
        typeof v?.estimate === "number"
          ? v.estimate
          : typeof v?.estimatedValue === "number"
            ? v.estimatedValue
            : null;
      if (main != null) {
        setEstimated(main);
        setRangeMin(typeof v.minValue === "number" ? v.minValue : typeof v.rangeMin === "number" ? v.rangeMin : null);
        setRangeMax(typeof v.maxValue === "number" ? v.maxValue : typeof v.rangeMax === "number" ? v.rangeMax : null);
        setLeadId(typeof data.leadId === "string" ? data.leadId : null);
        setStatus("success");
        requestAnimationFrame(() => {
          resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      } else {
        setStatus("error");
        setErrorMsg("Unexpected response.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Try again.");
    }
  }

  const fmt = (n: number) =>
    n.toLocaleString(undefined, { maximumFractionDigits: 0, minimumFractionDigits: 0 });

  const waHref = getContactWhatsAppUrl(EVAL_WA_MESSAGE);
  const telBroker = getBrokerTelHref();
  const waBroker = getContactWhatsAppUrl(EVAL_WA_MESSAGE);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-10 sm:px-6 lg:px-8">
      {/* Above-the-fold CTAs — same broker line as CRM; tracking fires without leadId */}
      <section
        aria-label="Contact options"
        className="mb-6 rounded-2xl border border-premium-gold/30 bg-[#121212] px-4 py-4 sm:px-5"
      >
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.15em] text-premium-gold">
          FREE — no obligation
        </p>
        <p className="mt-1 text-center text-xs text-[#9CA3AF]">Speak with a licensed broker anytime</p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-3">
          <a
            href={telBroker}
            onClick={() => trackEvaluateCta(null, "call")}
            className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-[#0B0B0B] px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-white/5"
          >
            Call now
          </a>
          <a
            href={waBroker}
            rel="noopener noreferrer"
            target="_blank"
            onClick={() => trackEvaluateCta(null, "whatsapp")}
            className="inline-flex items-center justify-center rounded-xl border border-premium-gold/45 bg-[#0B0B0B] px-4 py-2.5 text-center text-sm font-semibold text-premium-gold hover:bg-premium-gold/10"
          >
            WhatsApp
          </a>
          <Link
            href="/sell#sell-consultation"
            onClick={() => trackEvaluateCta(null, "consultation_cta")}
            className="inline-flex items-center justify-center rounded-xl bg-premium-gold px-4 py-2.5 text-center text-sm font-bold text-[#0B0B0B] hover:bg-premium-gold"
          >
            Get consultation
          </Link>
        </div>
      </section>

      {/* §2 Form */}
      <section aria-labelledby="eval-form-heading">
        <h2 id="eval-form-heading" className="sr-only">
          Property details
        </h2>
        <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-white/10 bg-[#121212] p-6 sm:p-8">
          <div>
            <label htmlFor="eval-email" className="block text-xs font-medium uppercase tracking-wider text-premium-gold/90">
              Email <span className="text-red-400">*</span>
            </label>
            <input
              id="eval-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-4 py-3 text-sm text-white placeholder:text-[#737373] focus:border-premium-gold focus:outline-none focus:ring-2 focus:ring-premium-gold/35"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="eval-address" className="block text-xs font-medium uppercase tracking-wider text-premium-gold/90">
              Address
            </label>
            <input
              id="eval-address"
              name="address"
              required
              autoComplete="street-address"
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-4 py-3 text-sm text-white placeholder:text-[#737373] focus:border-premium-gold focus:outline-none focus:ring-2 focus:ring-premium-gold/35"
              placeholder="123 Main Street"
            />
          </div>
          <div>
            <label htmlFor="eval-city" className="block text-xs font-medium uppercase tracking-wider text-premium-gold/90">
              City
            </label>
            <select
              id="eval-city"
              name="city"
              required
              defaultValue=""
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-4 py-3 text-sm text-white focus:border-premium-gold focus:outline-none focus:ring-2 focus:ring-premium-gold/35"
            >
              {CITY_OPTIONS.map((o) => (
                <option key={o.value || "city-empty"} value={o.value} disabled={o.value === ""}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="eval-type" className="block text-xs font-medium uppercase tracking-wider text-premium-gold/90">
              Property type
            </label>
            <select
              id="eval-type"
              name="propertyType"
              required
              defaultValue=""
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-4 py-3 text-sm text-white focus:border-premium-gold focus:outline-none focus:ring-2 focus:ring-premium-gold/35"
            >
              {PROPERTY_TYPES.map((o) => (
                <option key={o.value || "empty"} value={o.value} disabled={o.value === ""}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="eval-bed" className="block text-xs font-medium uppercase tracking-wider text-premium-gold/90">
                Bedrooms
              </label>
              <input
                id="eval-bed"
                name="bedrooms"
                type="number"
                min={0}
                max={30}
                step={1}
                required
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-4 py-3 text-sm text-white focus:border-premium-gold focus:outline-none focus:ring-2 focus:ring-premium-gold/35"
              />
            </div>
            <div>
              <label htmlFor="eval-bath" className="block text-xs font-medium uppercase tracking-wider text-premium-gold/90">
                Bathrooms
              </label>
              <input
                id="eval-bath"
                name="bathrooms"
                type="number"
                min={0}
                max={30}
                step={0.5}
                required
                className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-4 py-3 text-sm text-white focus:border-premium-gold focus:outline-none focus:ring-2 focus:ring-premium-gold/35"
              />
            </div>
          </div>
          <div>
            <label htmlFor="eval-sqft" className="block text-xs font-medium uppercase tracking-wider text-premium-gold/90">
              Surface (sq ft)
            </label>
            <input
              id="eval-sqft"
              name="surfaceSqft"
              type="number"
              min={250}
              max={20000}
              step={1}
              required
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-4 py-3 text-sm text-white focus:border-premium-gold focus:outline-none focus:ring-2 focus:ring-premium-gold/35"
              placeholder="e.g. 1200"
            />
          </div>
          <div>
            <label htmlFor="eval-condition" className="block text-xs font-medium uppercase tracking-wider text-premium-gold/90">
              Condition <span className="font-normal text-[#737373]">(optional)</span>
            </label>
            <select
              id="eval-condition"
              name="condition"
              defaultValue=""
              className="mt-1.5 w-full rounded-xl border border-white/15 bg-[#0B0B0B] px-4 py-3 text-sm text-white focus:border-premium-gold focus:outline-none focus:ring-2 focus:ring-premium-gold/35"
            >
              {CONDITIONS.map((o) => (
                <option key={o.value || "c-empty"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {status === "error" && errorMsg ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200" role="alert">
              {errorMsg}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-center gap-4 border-t border-white/10 pt-4 text-[11px] text-[#9CA3AF]">
            <HintTooltip label="FREE — no obligation">
              <span>No obligation</span>
            </HintTooltip>
            <HintTooltip label="Indicative estimate only—not a formal appraisal.">
              <span>AI estimate</span>
            </HintTooltip>
            <HintTooltip label="Optional licensed broker follow-up if you want a deeper market opinion.">
              <span>Broker follow-up</span>
            </HintTooltip>
          </div>

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full rounded-xl bg-premium-gold py-3.5 text-sm font-bold text-[#0B0B0B] transition hover:bg-premium-gold disabled:opacity-60"
          >
            {status === "submitting" ? "Working…" : "Get FREE evaluation"}
          </button>
          <p className="text-center text-xs text-[#737373]">
            We&apos;ll email your estimate. A licensed broker may follow up if appropriate.
          </p>
        </form>
      </section>

      {/* §3 Result — hidden until successful submit */}
      <section
        ref={resultRef}
        className={`mt-12 scroll-mt-24 space-y-10 ${status === "success" && estimated != null ? "" : "sr-only"}`}
        aria-hidden={status !== "success" || estimated == null}
      >
        {status === "success" && estimated != null ? (
          <>
            <div className="rounded-2xl border border-premium-gold/35 bg-gradient-to-br from-[#121212] to-[#0B0B0B] p-8 shadow-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-premium-gold">AI estimate</p>
              <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Estimated property value</h2>
              <p className="mt-6 text-4xl font-bold tracking-tight text-white tabular-nums sm:text-6xl">${fmt(estimated)}</p>
              {rangeMin != null && rangeMax != null ? (
                <p className="mt-4 text-base text-[#B3B3B3]">
                  Range:{" "}
                  <span className="font-semibold text-white tabular-nums">
                    ${fmt(rangeMin)} – ${fmt(rangeMax)}
                  </span>
                </p>
              ) : null}
              <p className="mt-6 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-100/90">
                This AI estimate is based on market averages and may vary.
              </p>
              <p className="mt-4 text-center text-sm font-semibold text-white sm:text-base">
                Get my FREE consultation
              </p>
              <p className="mt-2 text-center text-sm text-[#B3B3B3]">
                Talk to a licensed broker and get a more accurate evaluation — no obligation.
              </p>
              <p className="mt-3 text-center text-xs text-[#737373]">
                Trusted by property owners in Quebec
              </p>
            </div>

            {/* High-conversion block */}
            <div className="rounded-2xl border border-premium-gold/25 bg-[#121212] p-6 sm:p-8">
              <h3 className="text-xl font-bold text-white sm:text-2xl">Next step — speak with a broker</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#B3B3B3] sm:text-base">
                Work with a licensed broker to get the most accurate price and sell faster.
              </p>
              <ol className="mt-4 list-inside list-decimal text-xs text-[#737373] sm:text-sm">
                <li>Call now for immediate answers</li>
                <li>WhatsApp for a quick chat</li>
                <li>Request your free consultation online</li>
              </ol>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/sell#sell-consultation"
                  onClick={() => trackEvaluateCta(leadId, "consultation_cta")}
                  className="inline-flex flex-1 items-center justify-center rounded-xl bg-premium-gold px-6 py-3.5 text-sm font-bold text-[#0B0B0B] shadow-lg hover:bg-premium-gold sm:flex-initial"
                >
                  Get my FREE consultation
                </Link>
                <a
                  href={telBroker}
                  onClick={() => trackEvaluateCta(leadId, "call")}
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/5 sm:flex-initial"
                >
                  Call now
                </a>
                <a
                  href={waBroker}
                  rel="noopener noreferrer"
                  target="_blank"
                  onClick={() => trackEvaluateCta(leadId, "whatsapp")}
                  className="inline-flex flex-1 items-center justify-center rounded-xl border border-premium-gold/45 px-6 py-3.5 text-sm font-semibold text-premium-gold hover:bg-premium-gold/10 sm:flex-initial"
                >
                  WhatsApp
                </a>
              </div>
              <p className="mt-3 text-center text-[10px] text-[#737373] sm:text-left">
                Prefer chat?{" "}
                <a
                  href={waHref}
                  onClick={() => trackEvaluateCta(leadId, "whatsapp")}
                  className="text-premium-gold hover:underline"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Open WhatsApp with a prefilled message
                </a>
              </p>
            </div>

            {/* Broker card */}
            <div
              role="button"
              tabIndex={0}
              className="cursor-pointer rounded-2xl border border-premium-gold/25 bg-[#0B0B0B] p-6 sm:p-8 focus:outline-none focus:ring-2 focus:ring-premium-gold/40"
              onClick={() => trackEvaluateCta(leadId, "broker_card")}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") trackEvaluateCta(leadId, "broker_card");
              }}
            >
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="relative mx-auto h-36 w-28 shrink-0 overflow-hidden rounded-xl border-2 border-premium-gold sm:mx-0 sm:h-44 sm:w-32">
                  <Image
                    src="/images/broker.jpg"
                    alt="Mohamed Al Mashhour, Residential Real Estate Broker"
                    fill
                    className="object-cover"
                    sizes="128px"
                  />
                </div>
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <span className="inline-flex rounded-full border border-premium-gold/40 bg-premium-gold/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-premium-gold">
                    Verified Broker
                  </span>
                  <p className="mt-3 text-xl font-bold text-white sm:text-2xl">Mohamed Al Mashhour</p>
                  <p className="text-sm text-[#B3B3B3]">Residential Real Estate Broker (J1321)</p>
                  <p className="mt-3 text-sm text-white/90">Get a professional evaluation with full market analysis.</p>
                  <a
                    href={`mailto:${CONTACT_EMAIL}?subject=Property%20evaluation%20follow-up`}
                    className="mt-2 inline-block text-sm font-medium text-premium-gold hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {CONTACT_EMAIL}
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#121212] p-6 sm:p-8">
              <p className="text-center text-sm font-semibold text-white sm:text-base">
                More ways to connect — same trust standards
              </p>
              <div className="mt-6">
                <LeadCTA variant="consultation" trustMicrocopy leadId={leadId} />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setStatus("idle");
                setLeadId(null);
                setEstimated(null);
                setRangeMin(null);
                setRangeMax(null);
                setErrorMsg("");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="text-sm font-medium text-premium-gold hover:underline"
            >
              ← Evaluate another property
            </button>
          </>
        ) : null}
      </section>
    </div>
  );
}
