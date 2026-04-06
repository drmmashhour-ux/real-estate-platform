"use client";

import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

type Props = {
  className?: string;
};

/**
 * Early access — POST /api/growth/lead-capture → GrowthLeadCapture + GrowthEngineLead (CRM).
 */
export function GrowthLeadCapture({ className = "" }: Props) {
  const searchParams = useSearchParams();
  const referralCode = useMemo(() => searchParams.get("ref")?.trim().slice(0, 64) ?? "", [searchParams]);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [intent, setIntent] = useState<"host" | "guest">("guest");
  const [guestIntent, setGuestIntent] = useState<"buy" | "rent">("buy");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    if (!consent) {
      setStatus("err");
      setMessage("Please confirm consent to hear from us.");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/growth/lead-capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: fullName.trim() || null,
          email: email.trim(),
          phone: phone.trim() || null,
          city: city.trim() || null,
          category: category.trim() || null,
          intent,
          intentDetail: intent === "guest" ? guestIntent : undefined,
          consent: true,
          referralCode: referralCode || null,
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
      setFullName("");
      setCity("");
      setCategory("");
      setConsent(false);
    } catch {
      setStatus("err");
      setMessage("Network error. Try again.");
    }
  }

  return (
    <div className={className}>
      <h3 className="text-sm font-semibold uppercase tracking-[0.15em] text-premium-gold">Early access</h3>
      <p className="mt-2 text-sm text-[#B3B3B3]">
        Leave your details — we prioritize hosts and guests joining the first wave.
      </p>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3">
        <label className="sr-only" htmlFor="growth-name">
          Name
        </label>
        <input
          id="growth-name"
          type="text"
          name="fullName"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Name"
          className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#121212] px-4 py-2.5 text-sm text-white placeholder:text-[#737373] focus:border-premium-gold/50 focus:outline-none focus:ring-1 focus:ring-premium-gold/40"
        />
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
          className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#121212] px-4 py-2.5 text-sm text-white placeholder:text-[#737373] focus:border-premium-gold/50 focus:outline-none focus:ring-1 focus:ring-premium-gold/40"
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
          className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#121212] px-4 py-2.5 text-sm text-white placeholder:text-[#737373] focus:border-premium-gold/50 focus:outline-none focus:ring-1 focus:ring-premium-gold/40"
        />
        <label className="sr-only" htmlFor="growth-city">
          City
        </label>
        <input
          id="growth-city"
          type="text"
          name="city"
          autoComplete="address-level2"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City (optional)"
          className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#121212] px-4 py-2.5 text-sm text-white placeholder:text-[#737373] focus:border-premium-gold/50 focus:outline-none focus:ring-1 focus:ring-premium-gold/40"
        />
        <label className="sr-only" htmlFor="growth-category">
          Category
        </label>
        <input
          id="growth-category"
          type="text"
          name="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Interest (e.g. condo, cottage) — optional"
          className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#121212] px-4 py-2.5 text-sm text-white placeholder:text-[#737373] focus:border-premium-gold/50 focus:outline-none focus:ring-1 focus:ring-premium-gold/40"
        />
        <label htmlFor="growth-intent" className="text-xs text-[#737373]">
          I’m interested as
        </label>
        <select
          id="growth-intent"
          name="intent"
          value={intent}
          onChange={(e) => setIntent(e.target.value as "host" | "guest")}
          className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#121212] px-4 py-2.5 text-sm text-white focus:border-premium-gold/50 focus:outline-none focus:ring-1 focus:ring-premium-gold/40"
        >
          <option value="guest">Guest — find a stay</option>
          <option value="host">Host — list my place</option>
        </select>
        {intent === "guest" ? (
          <>
            <label htmlFor="growth-guest-intent" className="text-xs text-[#737373]">
              Intent
            </label>
            <select
              id="growth-guest-intent"
              value={guestIntent}
              onChange={(e) => setGuestIntent(e.target.value as "buy" | "rent")}
              className="min-h-[44px] w-full rounded-xl border border-white/15 bg-[#121212] px-4 py-2.5 text-sm text-white focus:border-premium-gold/50 focus:outline-none focus:ring-1 focus:ring-premium-gold/40"
            >
              <option value="buy">Buy</option>
              <option value="rent">Rent</option>
            </select>
          </>
        ) : null}
        <label className="flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-[#B3B3B3]">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-white/30 bg-[#121212]"
            required
          />
          <span>
            I agree to be contacted about LECIPM / BNHub updates in line with the privacy policy. I can unsubscribe
            anytime.
          </span>
        </label>
        <button
          type="submit"
          disabled={status === "loading"}
          className="min-h-[44px] rounded-xl bg-premium-gold px-6 py-2.5 text-sm font-bold text-[#0B0B0B] transition hover:brightness-110 disabled:opacity-60"
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
