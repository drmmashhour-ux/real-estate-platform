"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function MessagesClient({
  hostId,
  listingId,
  listingCode,
}: {
  hostId?: string;
  listingId?: string;
  /** Immutable public listing id (LEC-#####) for tracking in thread copy */
  listingCode?: string | null;
}) {
  const idLine = listingCode ? `[Listing ${listingCode}]\n` : "";
  const [message, setMessage] = useState(idLine);

  useEffect(() => {
    setMessage(idLine);
  }, [idLine]);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!hostId || !message.trim()) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/bnhub/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostId, listingId: listingId ?? undefined, body: message.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send");
      setSent(true);
      setMessage(idLine);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setLoading(false);
    }
  }

  if (hostId) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-slate-200">Contact host</h2>
        <p className="mt-1 text-sm text-slate-400">Send a message about this listing. The host will reply via the platform.</p>
        {listingCode ? (
          <p className="mt-2 text-xs text-slate-500">
            Listing ID{" "}
            <span className="font-mono text-slate-300">{listingCode}</span>{" "}
            <span className="text-slate-600">(prefixed in your message for tracking)</span>
          </p>
        ) : null}
        {sent && (
          <p className="mt-3 text-sm text-emerald-400">Message sent. The host will be notified.</p>
        )}
        <form onSubmit={handleSend} className="mt-4 space-y-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask about availability, amenities, check-in..."
            rows={4}
            required
            className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            {loading ? "Sending…" : "Send message"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center">
      <p className="text-slate-400">No conversations yet.</p>
      <p className="mt-2 text-sm text-slate-500">
        When you contact a host from a listing page, your messages will appear here.
      </p>
      <Link href="/bnhub" className="mt-4 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300">
        Browse stays →
      </Link>
    </div>
  );
}
