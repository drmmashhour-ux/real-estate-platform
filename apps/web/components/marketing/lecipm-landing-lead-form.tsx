"use client";

import { type FormEvent, useState } from "react";

export function LecipmLandingLeadForm({ idPrefix = "lead" }: { idPrefix?: string }) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);
    setStatus("loading");
    try {
      const r = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "launch_lead_capture",
          email: email.trim(),
          ...(phone.trim() ? { phone: phone.trim() } : {}),
        }),
      });
      const data = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Try again.");
        return;
      }
      setStatus("ok");
      setMessage("You're in — we'll follow up shortly.");
      setEmail("");
      setPhone("");
    } catch {
      setStatus("error");
      setMessage("Network error. Try again.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex max-w-md flex-col gap-4">
      <label className="sr-only" htmlFor={`${idPrefix}-email`}>
        Email
      </label>
      <input
        id={`${idPrefix}-email`}
        name="email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(ev) => setEmail(ev.target.value)}
        placeholder="Work email"
        className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 outline-none ring-brand-gold/0 transition focus:border-brand-gold/50 focus:ring-2 focus:ring-brand-gold/30"
      />
      <label className="sr-only" htmlFor={`${idPrefix}-phone`}>
        Phone
      </label>
      <input
        id={`${idPrefix}-phone`}
        name="phone"
        type="tel"
        autoComplete="tel"
        value={phone}
        onChange={(ev) => setPhone(ev.target.value)}
        placeholder="Phone (optional)"
        className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 outline-none ring-brand-gold/0 transition focus:border-brand-gold/50 focus:ring-2 focus:ring-brand-gold/30"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-xl bg-brand-gold px-6 py-3 text-center text-sm font-semibold text-black transition hover:bg-brand-gold/90 disabled:opacity-60"
      >
        {status === "loading" ? "Sending…" : "Unlock full analysis"}
      </button>
      {message ? (
        <p
          className={`text-center text-sm ${status === "ok" ? "text-brand-gold" : "text-red-400"}`}
          role="status"
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
