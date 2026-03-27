"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

type Props = {
  className?: string;
};

/**
 * First-100 lead capture — POST /api/growth/lead-capture → GrowthLeadCapture.
 */
export function GrowthLeadCapture({ className = "" }: Props) {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [intent, setIntent] = useState<"host" | "guest">("guest");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setStatus("loading");
    try {
      const res = await fetch("/api/growth/lead-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          phone: phone.trim() || null,
          intent,
          source: "early_access_lp",
          utmSource: searchParams.get("utm_source") ?? undefined,
          utmMedium: searchParams.get("utm_medium") ?? undefined,
          utmCampaign: searchParams.get("utm_campaign") ?? undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setStatus("err");
        setMessage(data.error ?? "Something went wrong.");
        return;
      }
      setStatus("ok");
      setMessage("Thanks — we’ll reach out shortly.");
      setEmail("");
      setPhone("");
    } catch {
      setStatus("err");
      setMessage("Network error. Try again.");
    }
  }

  return (
    <div className={className}>
      <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-[#C9A646]">Early access</h3>
      <p className="mt-2 text-sm text-[#B3B3B3]">
        Leave your details — we prioritize hosts and guests joining the first wave.
      </p>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
        <label className="sr-only" htmlFor="growth-email">
          Email
        </label>
        <input
          id="growth-email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#121212] px-4 py-2.5 text-sm text-white placeholder:text-[#737373] focus:border-[#C9A646]/50 focus:outline-none focus:ring-1 focus:ring-[#C9A646]/40"
        />
        <label className="sr-only" htmlFor="growth-phone">
          Phone (optional)
        </label>
        <input
          id="growth-phone"
          type="tel"
          name="phone"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone (optional)"
          className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#121212] px-4 py-2.5 text-sm text-white placeholder:text-[#737373] focus:border-[#C9A646]/50 focus:outline-none focus:ring-1 focus:ring-[#C9A646]/40"
        />
        <label htmlFor="growth-intent" className="text-xs text-[#737373]">
          I’m interested as
        </label>
        <select
          id="growth-intent"
          name="intent"
          value={intent}
          onChange={(e) => setIntent(e.target.value as "host" | "guest")}
          className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#121212] px-4 py-2.5 text-sm text-white focus:border-[#C9A646]/50 focus:outline-none focus:ring-1 focus:ring-[#C9A646]/40"
        >
          <option value="guest">Guest — find a stay</option>
          <option value="host">Host — list my place</option>
        </select>
        <button
          type="submit"
          disabled={status === "loading"}
          className="min-h-[44px] rounded-xl bg-[#C9A646] px-6 py-2.5 text-sm font-bold text-[#0B0B0B] transition hover:brightness-110 disabled:opacity-60"
        >
          {status === "loading" ? "Sending…" : "Request early access"}
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
