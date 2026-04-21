"use client";

import { useState } from "react";

/** Broker-only: log a Centris-originated inquiry against an owned listing (same CRM row as web funnel). */
export function BrokerCentrisManualLeadForm() {
  const [listingId, setListingId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [attests, setAttests] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    setMsg(null);
    if (!listingId.trim() || !name.trim()) {
      setErr("Listing ID and prospect name are required.");
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setErr("Provide an email or phone.");
      return;
    }
    if (!attests) {
      setErr("Confirm you may record this contact under applicable privacy law.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/broker/centris-lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          listingId: listingId.trim(),
          name: name.trim(),
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          notes: notes.trim() || undefined,
          brokerAttestsConsent: true,
        }),
      });
      const j = (await r.json()) as { error?: string; leadId?: string };
      if (!r.ok) throw new Error(j.error ?? "Failed");
      setMsg(`Lead saved — ID ${j.leadId?.slice(0, 12)}…`);
      setNotes("");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/40 p-5">
      <h2 className="text-sm font-semibold text-white">Record Centris inquiry</h2>
      <p className="mt-1 text-xs text-slate-500">
        Use when a buyer reached you via Centris syndication. Must match a listing you own on LECIPM (FSBO or CRM).
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-slate-400">
          Listing ID (UUID from URL)
          <input
            value={listingId}
            onChange={(e) => setListingId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            placeholder="cuid…"
          />
        </label>
        <label className="block text-xs text-slate-400">
          Prospect name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="block text-xs text-slate-400">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="block text-xs text-slate-400">
          Phone
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          />
        </label>
      </div>
      <label className="mt-3 block text-xs text-slate-400">
        Notes (optional)
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
        />
      </label>
      <label className="mt-3 flex cursor-pointer items-start gap-2 text-[11px] text-slate-400">
        <input
          type="checkbox"
          checked={attests}
          onChange={(e) => setAttests(e.target.checked)}
          className="mt-0.5 rounded border-slate-600"
        />
        <span>I confirm I have a lawful basis to share this contact with LECIPM for CRM purposes (Law 25 / privacy).</span>
      </label>
      <button
        type="button"
        disabled={busy}
        onClick={() => void submit()}
        className="mt-4 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save as Centris lead"}
      </button>
      {err ? <p className="mt-2 text-sm text-rose-400">{err}</p> : null}
      {msg ? <p className="mt-2 text-sm text-emerald-400">{msg}</p> : null}
    </div>
  );
}
