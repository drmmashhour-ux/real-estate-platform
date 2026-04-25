"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { normalizeBnhubConfirmationCode } from "@/lib/bnhub/normalize-confirmation-code";

export function FindReservationClient() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const normalized = normalizeBnhubConfirmationCode(code);
    if (normalized.length < 6) {
      setError("Enter the confirmation code from your email.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/bnhub/bookings/lookup-by-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalized }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; nextPath?: string };
      if (!res.ok || !data.ok || !data.nextPath) {
        setError(data.error ?? "Could not find a reservation.");
        return;
      }
      router.push(`/bnhub/login?next=${encodeURIComponent(data.nextPath)}`);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-premium-gold/25 bg-black/60 p-6 backdrop-blur-sm sm:p-8">
      <h1 className="text-xl font-bold text-premium-gold sm:text-2xl">Find your reservation</h1>
      <p className="mt-2 text-sm text-neutral-400">
        After the host confirms and payment completes, we email a <strong className="text-premium-gold">confirmation code</strong>{" "}
        (for example <span className="font-mono text-neutral-300">BNH-A3K9P2</span>). Enter it here, then sign in to open your
        booking — the same place you&apos;ll see Prestige loyalty progress when you&apos;re eligible.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block text-xs font-semibold uppercase tracking-wide text-premium-gold/80">
          Confirmation code
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="BNH-…"
            autoComplete="off"
            className="mt-2 w-full rounded-xl border border-premium-gold/30 bg-black/40 px-4 py-3 font-mono text-sm text-white placeholder:text-neutral-600 focus:border-premium-gold focus:outline-none focus:ring-1 focus:ring-premium-gold"
          />
        </label>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="flex min-h-[48px] w-full items-center justify-center rounded-xl bg-premium-gold text-sm font-bold text-[#0a0a0a] transition hover:brightness-110 disabled:opacity-60"
        >
          {loading ? "Searching…" : "Continue to sign in"}
        </button>
      </form>
      <p className="mt-6 text-center text-xs text-neutral-500">
        <Link href="/bnhub" className="text-premium-gold hover:underline">
          Back to BNHUB
        </Link>
      </p>
    </div>
  );
}
