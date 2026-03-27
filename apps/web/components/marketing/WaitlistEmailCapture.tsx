"use client";

import { useState } from "react";
import { getTrackingSessionId } from "@/lib/tracking";

type Props = {
  source?: string;
  className?: string;
};

/**
 * Growth waitlist — POST /api/waitlist → WaitlistUser + analytics.
 */
export function WaitlistEmailCapture({ source = "homepage", className = "" }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setStatus("loading");
    try {
      const sessionId = getTrackingSessionId();
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          source,
          sessionId: sessionId ?? undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setStatus("err");
        setMessage(data.error ?? "Something went wrong.");
        return;
      }
      setStatus("ok");
      setMessage("You’re on the list — we’ll send updates.");
      setEmail("");
    } catch {
      setStatus("err");
      setMessage("Network error. Try again.");
    }
  }

  return (
    <div className={className}>
      <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-[#C9A646]">Get updates</h3>
      <p className="mt-2 text-sm text-[#B3B3B3]">Product news and investment tips — unsubscribe anytime.</p>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <label className="sr-only" htmlFor="waitlist-email">
          Enter your email for updates
        </label>
        <input
          id="waitlist-email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email for updates"
          className="min-h-[44px] flex-1 rounded-xl border border-white/15 bg-[#121212] px-4 py-2.5 text-sm text-white placeholder:text-[#737373] focus:border-[#C9A646]/50 focus:outline-none focus:ring-1 focus:ring-[#C9A646]/40"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="min-h-[44px] shrink-0 rounded-xl bg-[#C9A646] px-6 py-2.5 text-sm font-bold text-[#0B0B0B] transition hover:brightness-110 disabled:opacity-60"
        >
          {status === "loading" ? "Joining…" : "Join waitlist"}
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
