"use client";

import { useState } from "react";
import Link from "next/link";

type Props = {
  sessionId: string | null;
};

/**
 * Post–Checkout success: no trust in session_id for auth (display only).
 * Billing Portal uses POST /api/stripe/billing-portal + session cookie.
 */
export function WorkspaceSubscriptionSuccessClient({ sessionId }: Props) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function openPortal() {
    setLoading(true);
    setErr(null);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const res = await fetch("/api/stripe/billing-portal", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ returnUrl: `${origin}/dashboard` }),
    });
    const data = (await res.json()) as { url?: string; error?: string };
    if (data.url) {
      window.location.href = data.url;
      return;
    }
    setErr(data.error ?? "Could not open billing portal");
    setLoading(false);
  }

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-800 bg-slate-950/80 p-8 text-slate-100 shadow-xl">
      <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400/90">LECIPM</p>
      <h1 className="mt-2 text-2xl font-semibold">Subscription started</h1>
      <p className="mt-2 text-sm text-slate-400">
        Your workspace plan is processing. Stripe will confirm via webhook; you can manage payment method and
        subscription from the billing portal.
      </p>
      {sessionId ? (
        <p className="mt-4 font-mono text-xs text-slate-500">
          Checkout session: <span className="text-slate-400">{sessionId}</span>
        </p>
      ) : null}
      {err ? <p className="mt-4 text-sm text-red-400">{err}</p> : null}
      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => void openPortal()}
          className="rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-60"
        >
          {loading ? "Opening…" : "Manage billing"}
        </button>
        <Link
          href="/dashboard"
          className="rounded-lg border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-900"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
