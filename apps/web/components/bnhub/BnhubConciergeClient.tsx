"use client";

import { useState } from "react";
import { getTrackingSessionId } from "@/lib/tracking";

export function BnhubConciergeClient() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErr(null);
    try {
      const res = await fetch("/api/bnhub/concierge-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          message,
          sessionId: getTrackingSessionId(),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setStatus("err");
        setErr(data.error ?? "Could not send request");
        return;
      }
      setStatus("ok");
    } catch {
      setStatus("err");
      setErr("Network error");
    }
  }

  if (status === "ok") {
    return (
      <p className="mt-8 rounded-2xl border border-emerald-500/40 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-100">
        Thanks — we received your note and will follow up by email.
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4">
      <label className="block text-sm">
        <span className="text-white/70">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-white outline-none ring-[#D4AF37]/30 focus:ring-2"
          autoComplete="email"
        />
      </label>
      <label className="block text-sm">
        <span className="text-white/70">How can we help?</span>
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          className="mt-1 w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-white outline-none ring-[#D4AF37]/30 focus:ring-2"
          placeholder="Dates, guests, neighbourhood, listing code if you have one…"
        />
      </label>
      {err ? <p className="text-sm text-red-400">{err}</p> : null}
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-xl bg-[#D4AF37] px-6 py-2.5 text-sm font-semibold text-black hover:brightness-110 disabled:opacity-50"
      >
        {status === "loading" ? "Sending…" : "Send request"}
      </button>
    </form>
  );
}
