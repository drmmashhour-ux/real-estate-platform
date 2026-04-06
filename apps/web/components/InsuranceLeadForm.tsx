"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { INSURANCE_LEAD_CONSENT_LABEL, INSURANCE_LEAD_TRUST_LINE } from "@/lib/insurance/consent-text";
import { trackInsuranceLeadClient } from "@/lib/insurance/track-client";

export type InsuranceLeadTypeInput = "travel" | "property" | "mortgage";
export type InsuranceLeadSourceInput = "bnbhub" | "listing" | "checkout" | "manual";

export type InsuranceLeadFormProps = {
  leadType: InsuranceLeadTypeInput;
  source: InsuranceLeadSourceInput;
  listingId?: string | null;
  bookingId?: string | null;
  headline?: string;
  subheadline?: string;
  className?: string;
  /** A/B test: A = email+consent first, phone after submit; B = phone visible up front. */
  variant?: "A" | "B";
};

const CTA_PRIMARY = "Get your free insurance quote in 30 seconds";

export function InsuranceLeadForm({
  leadType,
  source,
  listingId,
  bookingId,
  headline,
  subheadline,
  className = "",
  variant = "A",
}: InsuranceLeadFormProps) {
  const variantId = variant;
  const showPhoneUpFront = variant === "B";

  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [enrichPhone, setEnrichPhone] = useState("");
  const [enrichBusy, setEnrichBusy] = useState(false);
  const [enrichDone, setEnrichDone] = useState(false);

  const startedTracked = useRef(false);
  const idSuffix = `${leadType}-${source}-${variantId}`;

  useEffect(() => {
    trackInsuranceLeadClient("lead_form_viewed", { source, leadType, variantId });
  }, [source, leadType, variantId]);

  const onEmailFocus = useCallback(() => {
    if (startedTracked.current) return;
    startedTracked.current = true;
    trackInsuranceLeadClient("lead_started", { source, leadType, variantId });
  }, [source, leadType, variantId]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!consent) {
      setError("Please confirm you agree to be contacted by an insurance partner.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/insurance/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-insurance-device": "web",
        },
        body: JSON.stringify({
          email: email.trim(),
          phone: showPhoneUpFront ? phone.trim() || undefined : undefined,
          fullName: fullName.trim() || undefined,
          message: message.trim() || undefined,
          leadType,
          source,
          listingId: listingId ?? undefined,
          bookingId: bookingId ?? undefined,
          consentGiven: true,
          variantId,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean; leadId?: string };
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Something went wrong.");
        return;
      }
      setLeadId(typeof data.leadId === "string" ? data.leadId : null);
      setDone(true);
    } catch {
      setError("Network error. Try again.");
      trackInsuranceLeadClient("lead_failed", { source, leadType, variantId });
    } finally {
      setSubmitting(false);
    }
  }

  async function onEnrichPhone(e: React.FormEvent) {
    e.preventDefault();
    if (!leadId || !enrichPhone.trim()) return;
    setEnrichBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/insurance/leads/${encodeURIComponent(leadId)}/enrich`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), phone: enrichPhone.trim() }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(typeof data.error === "string" ? data.error : "Could not save phone.");
        return;
      }
      setEnrichDone(true);
    } catch {
      setError("Network error saving phone.");
    } finally {
      setEnrichBusy(false);
    }
  }

  if (done) {
    return (
      <div
        className={`rounded-2xl border border-emerald-500/35 bg-emerald-500/10 px-4 py-4 text-sm text-emerald-100 ${className}`}
      >
        <p className="font-semibold text-emerald-200">Thank you — you&apos;re on the list.</p>
        <p className="mt-1 text-emerald-100/90">
          A licensed insurance partner may reach out using the email you provided.
        </p>
        {!showPhoneUpFront && leadId && !enrichDone ? (
          <form onSubmit={onEnrichPhone} className="mt-4 border-t border-emerald-500/20 pt-4">
            <p className="text-xs font-medium text-emerald-200/90">Optional: add phone for a faster callback</p>
            <input
              type="tel"
              autoComplete="tel"
              value={enrichPhone}
              onChange={(e) => setEnrichPhone(e.target.value)}
              placeholder="Phone (optional)"
              className="mt-2 w-full rounded-lg border border-emerald-500/30 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            <button
              type="submit"
              disabled={enrichBusy || !enrichPhone.trim()}
              className="mt-2 w-full rounded-lg bg-emerald-600/90 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              {enrichBusy ? "Saving…" : "Save phone"}
            </button>
          </form>
        ) : null}
        {enrichDone ? <p className="mt-3 text-xs text-emerald-200/80">Phone saved — thank you.</p> : null}
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-slate-700/80 bg-slate-900/70 px-4 py-5 shadow-inner shadow-black/20 ${className}`}
    >
      {headline ? <p className="text-sm font-semibold text-amber-200/95">{headline}</p> : null}
      {subheadline ? <p className="mt-1 text-xs text-slate-400">{subheadline}</p> : null}
      <p className="mt-3 text-[11px] leading-relaxed text-slate-500">{INSURANCE_LEAD_TRUST_LINE}</p>
      <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-amber-200/70">
        Limited-time partner offer · No obligation
      </p>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-400" htmlFor={`ins-email-${idSuffix}`}>
            Email <span className="text-amber-400">*</span>
          </label>
          <input
            id={`ins-email-${idSuffix}`}
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={onEmailFocus}
            className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-amber-500/30 focus:border-amber-500/50 focus:ring-2"
          />
        </div>
        {showPhoneUpFront ? (
          <div>
            <label className="block text-xs font-medium text-slate-400" htmlFor={`ins-phone-${idSuffix}`}>
              Phone (optional)
            </label>
            <input
              id={`ins-phone-${idSuffix}`}
              type="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none ring-amber-500/30 focus:border-amber-500/50 focus:ring-2"
            />
          </div>
        ) : null}
        <details className="rounded-lg border border-slate-700/60 bg-slate-950/40 px-3 py-2">
          <summary className="cursor-pointer text-xs font-medium text-slate-400">Add name or message (optional)</summary>
          <div className="mt-3 space-y-3 pt-1">
            <input
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
              className="w-full rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-amber-500/30"
            />
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message"
              className="w-full resize-none rounded-lg border border-slate-600 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-amber-500/30"
            />
          </div>
        </details>
        <label className="flex cursor-pointer items-start gap-3 text-xs text-slate-300">
          <input
            type="checkbox"
            required
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-500 bg-slate-950 text-amber-500 focus:ring-amber-500/40"
          />
          <span>{INSURANCE_LEAD_CONSENT_LABEL}</span>
        </label>
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-amber-400 disabled:opacity-60"
        >
          {submitting ? "Sending…" : CTA_PRIMARY}
        </button>
      </form>
    </div>
  );
}
