"use client";

import { useState } from "react";

export function HostLeadCaptureForm() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [listingUrl, setListingUrl] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/hosts/leads/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email || undefined,
          phone: phone || undefined,
          city: city || undefined,
          listingUrl: listingUrl || undefined,
          source: "hosts_landing",
        }),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) setMsg(j.error ?? "Could not save");
      else setMsg("Thanks — we’ll follow up. This is not a booking confirmation.");
    } catch {
      setMsg("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-lg space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left">
      <h3 className="font-serif text-lg text-white">Start onboarding</h3>
      <p className="text-xs text-zinc-500">Optional contact — we’ll only use it for host success outreach.</p>
      <label className="block text-sm text-zinc-300">
        Email
        <input
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="email"
        />
      </label>
      <label className="block text-sm text-zinc-300">
        Phone
        <input
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          inputMode="tel"
        />
      </label>
      <label className="block text-sm text-zinc-300">
        City
        <input
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
      </label>
      <label className="block text-sm text-zinc-300">
        Listing URL (Airbnb / other)
        <input
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
          value={listingUrl}
          onChange={(e) => setListingUrl(e.target.value)}
          placeholder="https://"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-premium-gold py-3 text-sm font-semibold text-black disabled:opacity-50"
      >
        {loading ? "Sending…" : "Submit"}
      </button>
      {msg ? <p className="text-center text-sm text-zinc-400">{msg}</p> : null}
    </form>
  );
}
