"use client";

import { useState } from "react";

export function RemindListingCodesButton() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function send() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/fsbo/listings/remind-codes", { method: "POST", credentials: "same-origin" });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok) {
        setMsg(typeof data.error === "string" ? data.error : "Could not send email");
        return;
      }
      setMsg("Check your inbox for your listing codes.");
    } catch {
      setMsg("Network error — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-4 rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-slate-300">
      <p className="font-medium text-slate-200">Forgot a listing code?</p>
      <p className="mt-1 text-xs text-slate-500">
        We’ll email every reference code on this account to your login email. While signed in, you can also open any
        listing from this page without a code.
      </p>
      <button
        type="button"
        disabled={busy}
        onClick={() => void send()}
        className="mt-2 rounded-lg border border-premium-gold/40 bg-premium-gold/10 px-3 py-1.5 text-xs font-medium text-premium-gold hover:bg-premium-gold/15 disabled:opacity-50"
      >
        {busy ? "Sending…" : "Email my listing codes"}
      </button>
      {msg ? <p className="mt-2 text-xs text-emerald-300/90">{msg}</p> : null}
    </div>
  );
}
