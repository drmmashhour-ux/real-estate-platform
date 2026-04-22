"use client";

import { useState } from "react";

const CONFIRM =
  "You're on the waitlist — we'll contact you if a spot opens in your area.";

export function OperatorWaitlistApplyForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [residenceName, setResidenceName] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/operators/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name,
          email,
          residenceName,
          city,
          ...(phone.trim() ? { phone: phone.trim() } : {}),
        }),
      });
      const data = (await res.json()) as { error?: string; ok?: boolean; message?: string };
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div
        className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 px-6 py-8 text-center text-emerald-50"
        role="status"
      >
        <p className="text-lg font-medium leading-relaxed">{CONFIRM}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-lg space-y-5">
      <div className="rounded-2xl border border-white/10 bg-black/40 p-6 backdrop-blur">
        <p className="mb-6 text-center text-sm text-neutral-400">
          Limited partners per area — we review every application.
        </p>

        <label className="block space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Your name</span>
          <input
            required
            className="w-full rounded-lg border border-white/15 bg-black/60 px-3 py-2.5 text-white outline-none focus:border-amber-500/60"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </label>

        <label className="mt-4 block space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Email</span>
          <input
            required
            type="email"
            className="w-full rounded-lg border border-white/15 bg-black/60 px-3 py-2.5 text-white outline-none focus:border-amber-500/60"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </label>

        <label className="mt-4 block space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Residence name</span>
          <input
            required
            className="w-full rounded-lg border border-white/15 bg-black/60 px-3 py-2.5 text-white outline-none focus:border-amber-500/60"
            value={residenceName}
            onChange={(e) => setResidenceName(e.target.value)}
          />
        </label>

        <label className="mt-4 block space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">City</span>
          <input
            required
            className="w-full rounded-lg border border-white/15 bg-black/60 px-3 py-2.5 text-white outline-none focus:border-amber-500/60"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            autoComplete="address-level2"
          />
        </label>

        <label className="mt-4 block space-y-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
            Phone <span className="font-normal text-neutral-500">(optional)</span>
          </span>
          <input
            type="tel"
            className="w-full rounded-lg border border-white/15 bg-black/60 px-3 py-2.5 text-white outline-none focus:border-amber-500/60"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
        </label>

        {error ? (
          <p className="mt-4 text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 py-3.5 font-semibold text-black transition hover:from-amber-500 hover:to-amber-400 disabled:opacity-50"
        >
          {loading ? "Sending…" : "Apply"}
        </button>
      </div>
    </form>
  );
}
