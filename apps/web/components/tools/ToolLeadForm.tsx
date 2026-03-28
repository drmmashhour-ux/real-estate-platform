"use client";

import { useState } from "react";

type LeadType = "investor_lead" | "first_home_buyer_lead" | "welcome_tax_lead" | "municipality_tax_lead";

export function ToolLeadForm({
  leadType,
  toolInputs,
  toolOutputs,
}: {
  leadType: LeadType;
  toolInputs: Record<string, unknown>;
  toolOutputs: Record<string, unknown>;
}) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function send() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/tools/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadType,
          email,
          phone,
          name,
          toolInputs,
          toolOutputs,
          city: typeof toolInputs.city === "string" ? toolInputs.city : undefined,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Failed");
      setStatus("Thanks — we received your estimate request.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-premium-gold/25 bg-black/50 p-4">
      <p className="text-sm font-medium text-premium-gold">Send my estimate</p>
      <p className="mt-1 text-xs text-slate-500">Optional — we&apos;ll store inputs/outputs with your request.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input
          className="rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="email"
          className="rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white"
          placeholder="Email *"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="rounded-lg border border-white/10 bg-black/60 px-3 py-2 text-sm text-white sm:col-span-2"
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>
      <button
        type="button"
        disabled={loading || !email.includes("@")}
        onClick={() => void send()}
        className="mt-3 rounded-lg bg-premium-gold px-4 py-2 text-sm font-semibold text-black disabled:opacity-40"
      >
        {loading ? "Sending…" : "Send my estimate"}
      </button>
      {status ? <p className="mt-2 text-sm text-emerald-400">{status}</p> : null}
    </div>
  );
}
