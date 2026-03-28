"use client";

import { useState } from "react";
import { track, TrackingEvent } from "@/lib/tracking";

type Props = {
  /** Passed to API (homepage, wix, etc.) */
  source?: string;
  className?: string;
};

/**
 * “Get early access / updates” — POST /api/marketing/early-access
 */
export function EarlyAccessCaptureForm({ source = "homepage", className = "" }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setStatus("loading");
    try {
      const res = await fetch("/api/marketing/early-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setStatus("err");
        setMessage(data.error ?? "Something went wrong.");
        return;
      }
      setStatus("ok");
      setMessage("You’re on the list. We’ll be in touch.");
      setEmail("");
      track(TrackingEvent.CTA_CLICKED, {
        meta: { ctaKind: "early_access_submit", source },
      });
    } catch {
      setStatus("err");
      setMessage("Network error. Try again.");
    }
  }

  return (
    <div className={className}>
      <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-premium-gold">Stay in the loop</h3>
      <p className="mt-2 text-sm text-[#B3B3B3]">Get early access and product updates — no spam.</p>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <label className="sr-only" htmlFor="early-access-email">
          Email
        </label>
        <input
          id="early-access-email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="min-h-[44px] flex-1 rounded-xl border border-white/15 bg-[#121212] px-4 py-2.5 text-sm text-white placeholder:text-[#737373] focus:border-premium-gold/50 focus:outline-none focus:ring-1 focus:ring-premium-gold/40"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="min-h-[44px] shrink-0 rounded-xl bg-premium-gold px-6 py-2.5 text-sm font-bold text-[#0B0B0B] transition hover:brightness-110 disabled:opacity-60"
        >
          {status === "loading" ? "Sending…" : "Notify me"}
        </button>
      </form>
      {message ? (
        <p
          role="status"
          className={`mt-3 text-sm ${status === "ok" ? "text-emerald-400" : "text-red-400"}`}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
