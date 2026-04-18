"use client";

import { useState } from "react";

export function BriefingReviewBar({
  briefingId,
}: {
  briefingId: string;
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function review(approved: boolean) {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/founder/briefings/${briefingId}/review`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approved }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Erreur");
      setMsg(approved ? "Marqué comme revu." : "Retour enregistré.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-950/60 p-3">
      <span className="text-sm text-zinc-400">Revue fondateur</span>
      <button
        type="button"
        disabled={loading}
        className="rounded-lg bg-emerald-600/90 px-3 py-1.5 text-sm text-white"
        onClick={() => void review(true)}
      >
        Approuver / revu
      </button>
      <button
        type="button"
        disabled={loading}
        className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm text-zinc-200"
        onClick={() => void review(false)}
      >
        Sans approbation
      </button>
      {msg && <span className="text-xs text-zinc-400">{msg}</span>}
    </div>
  );
}
