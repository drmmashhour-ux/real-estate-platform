"use client";

import { useState } from "react";
import { bnhubPremium } from "./bnhub-premium-ui";

export function ConciergeChatPanel({
  sessionId: initialSessionId,
  listingId,
  bookingId,
}: {
  sessionId?: string | null;
  listingId?: string;
  bookingId?: string;
}) {
  const [sessionId, setSessionId] = useState(initialSessionId ?? "");
  const [text, setText] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  async function ensureSession() {
    if (sessionId) return sessionId;
    const r = await fetch("/api/bnhub/concierge/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, bookingId, roleContext: "GUEST" }),
    });
    const j = (await r.json()) as { session?: { id: string }; error?: string };
    if (!r.ok) throw new Error(j.error ?? "session failed");
    const id = j.session!.id;
    setSessionId(id);
    return id;
  }

  async function send() {
    setBusy(true);
    try {
      const sid = await ensureSession();
      const r = await fetch(`/api/bnhub/concierge/${sid}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const j = (await r.json()) as { reply?: { messageText: string }; error?: string };
      if (!r.ok) throw new Error(j.error ?? "send failed");
      setLog((prev) => [...prev, `You: ${text}`, `Concierge: ${j.reply?.messageText ?? ""}`]);
      setText("");
    } catch (e) {
      setLog((prev) => [...prev, String(e instanceof Error ? e.message : e)]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`flex flex-col gap-3 p-4 ${bnhubPremium.panel}`}>
      <p className={bnhubPremium.heading}>Concierge</p>
      <p className={bnhubPremium.subtext}>
        Informational only — BNHub does not guarantee third-party services. EN/FR replies in mock mode.
      </p>
      <div className="max-h-48 space-y-2 overflow-y-auto text-sm text-zinc-300">
        {log.map((line, i) => (
          <p key={i} className="whitespace-pre-wrap">
            {line}
          </p>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="min-h-[80px] rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-200"
        placeholder="Ask about arrival, add-ons, or packages…"
      />
      <button type="button" disabled={busy} onClick={() => void send()} className={bnhubPremium.button}>
        {busy ? "Sending…" : "Send"}
      </button>
    </div>
  );
}
