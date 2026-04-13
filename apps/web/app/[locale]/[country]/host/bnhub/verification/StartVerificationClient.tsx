"use client";

import { useState } from "react";

export function StartVerificationClient() {
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    setMsg(null);
    try {
      const returnUrl =
        typeof window !== "undefined" ? `${window.location.origin}/host/bnhub/verification` : "";
      const res = await fetch("/api/bnhub/trust/identity/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnUrl }),
      });
      const data = (await res.json()) as { error?: string; url?: string | null; clientSecret?: string | null };
      if (!res.ok) {
        setMsg(data.error ?? "Could not start verification.");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setMsg(
        "Session started. If you use Stripe Identity embedded UI, wire clientSecret in your mobile or web client."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={loading}
        onClick={() => start()}
        className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
      >
        {loading ? "Starting…" : "Start or continue verification"}
      </button>
      {msg ? <p className="text-sm text-amber-200">{msg}</p> : null}
    </div>
  );
}
