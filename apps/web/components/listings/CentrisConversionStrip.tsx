"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

type CentrisCaptureIntent = "unlock_analysis" | "book_visit" | "download_report";

type Props = {
  listingId: string;
};

export function CentrisConversionStrip({ listingId }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function submit(intent: CentrisCaptureIntent) {
    setError(null);
    setDone(null);
    if (!email.trim() && !phone.trim()) {
      setError("Enter an email or phone number.");
      return;
    }
    if (!consentPrivacy) {
      setError("Acknowledge privacy collection (Law 25) to continue.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/leads/centris/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          listingId,
          intent,
          name: name.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          consentPrivacy,
          consentMarketing,
        }),
      });
      const j = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(j.error ?? "Request failed");
      setDone(
        intent === "book_visit"
          ? "Request received — a representative will reach out to schedule."
          : intent === "download_report"
            ? "We’ll send your report link when ready."
            : "Analysis unlocked — check your inbox for the full summary."
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-950/40 to-slate-950/80 p-5 md:p-6"
      aria-labelledby="centris-funnel-heading"
    >
      <div className="flex flex-wrap items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 id="centris-funnel-heading" className="text-lg font-semibold text-white">
            From Centris — full picture on LECIPM
          </h2>
          <p className="mt-1 text-sm text-white/70">
            AI-style valuation context, investment signals, and documents stay on-platform. Leave your contact to
            unlock the full analysis and optional alerts.
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-xs text-white/55">
          Name (optional)
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none ring-amber-500/40 focus:ring-2"
            autoComplete="name"
          />
        </label>
        <label className="block text-xs text-white/55">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none ring-amber-500/40 focus:ring-2"
            autoComplete="email"
          />
        </label>
        <label className="block text-xs text-white/55">
          Phone
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none ring-amber-500/40 focus:ring-2"
            autoComplete="tel"
          />
        </label>
        <div className="flex flex-col justify-end gap-2 text-[11px] text-white/65">
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={consentPrivacy}
              onChange={(e) => setConsentPrivacy(e.target.checked)}
              className="mt-0.5 rounded border-white/30"
            />
            <span>I consent to the collection of this information under applicable privacy laws (including Québec Law 25).</span>
          </label>
          <label className="flex cursor-pointer items-start gap-2">
            <input
              type="checkbox"
              checked={consentMarketing}
              onChange={(e) => setConsentMarketing(e.target.checked)}
              className="mt-0.5 rounded border-white/30"
            />
            <span>I agree to receive property analysis and LECIPM follow-up by email or SMS.</span>
          </label>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={busy}
          onClick={() => void submit("unlock_analysis")}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-amber-500 px-4 text-sm font-semibold text-black transition hover:bg-amber-400 disabled:opacity-50"
        >
          Unlock full analysis
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void submit("book_visit")}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
        >
          Book visit
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void submit("download_report")}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-50"
        >
          Download report
        </button>
      </div>

      <div className="mt-4 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[11px] text-white/55">
        Premium add-ons (after capture): AI investment dossier, priority listing alerts, investor dashboard — available from
        your broker or in account billing when enabled.
      </div>

      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      {done ? <p className="mt-3 text-sm text-emerald-300">{done}</p> : null}
    </section>
  );
}
