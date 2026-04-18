"use client";

import { useState } from "react";
import type { BrokerProspectSource } from "@/modules/brokers/broker-pipeline.types";

type Props = {
  onAdded: () => Promise<void> | void;
};

export function BrokerQuickAddForm({ onAdded }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [agency, setAgency] = useState("");
  const [source, setSource] = useState<BrokerProspectSource>("manual");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!name.trim()) {
      setMsg({ type: "err", text: "Name is required." });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/broker-pipeline-v1", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          agency: agency.trim() || undefined,
          source,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Save failed");
      setName("");
      setEmail("");
      setPhone("");
      setAgency("");
      setSource("manual");
      setMsg({ type: "ok", text: "Broker added." });
      await onAdded();
    } catch (err) {
      setMsg({ type: "err", text: err instanceof Error ? err.message : "Error" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <p className="text-sm font-semibold text-white">Quick add prospect</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <input
          required
          placeholder="Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500"
        />
        <input
          placeholder="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500"
        />
        <input
          placeholder="Agency"
          value={agency}
          onChange={(e) => setAgency(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500"
        />
        <select
          value={source}
          onChange={(e) => setSource(e.target.value as BrokerProspectSource)}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
        >
          <option value="manual">manual</option>
          <option value="instagram">instagram</option>
          <option value="linkedin">linkedin</option>
          <option value="referral">referral</option>
        </select>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">Add email or phone when possible — helps match conversions later.</p>
      <button
        type="submit"
        disabled={saving}
        className="mt-3 rounded-lg bg-premium-gold px-4 py-2 text-sm font-bold text-black hover:opacity-95 disabled:opacity-50"
      >
        {saving ? "Saving…" : "Add Broker"}
      </button>
      {msg ? (
        <p className={`mt-2 text-sm ${msg.type === "ok" ? "text-emerald-400" : "text-red-400"}`} role="status">
          {msg.text}
        </p>
      ) : null}
    </form>
  );
}
