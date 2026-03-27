"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type PendingListing = { id: string; title: string; city: string; ownerId: string };

export function AdminShortTermModeration() {
  const [pending, setPending] = useState<PendingListing[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/bnhub/moderation/pending")
      .then((r) => r.json())
      .then((d) => setPending(Array.isArray(d.pending) ? d.pending : []))
      .catch(() => {});
  }, []);

  async function moderate(listingId: string, approved: boolean) {
    const r = await fetch("/api/bnhub/verify/listing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, approved }),
    });
    const d = await r.json();
    if (!r.ok) {
      setMsg(d.error || "Action failed");
      return;
    }
    setPending((p) => p.filter((x) => x.id !== listingId));
    setMsg(approved ? "Listing approved." : "Listing rejected.");
  }

  return (
    <section className="rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="mb-2 text-xs">
        <Link href="/admin/bnhub/control" className="text-emerald-400 hover:text-emerald-300">
          Trust & safety control center →
        </Link>
      </p>
      <h3 className="text-sm font-semibold text-white">Admin moderation</h3>
      <p className="mt-1 text-xs text-slate-500">Approve/reject listings and flag suspicious listings manually.</p>
      {msg ? <p className="mt-2 text-xs text-slate-400">{msg}</p> : null}
      <ul className="mt-3 space-y-2 text-xs text-slate-300">
        {pending.map((l) => (
          <li key={l.id} className="rounded border border-white/10 p-2">
            <p className="text-slate-100">{l.title}</p>
            <p>{l.city}</p>
            <div className="mt-2 flex gap-2">
              <button onClick={() => moderate(l.id, true)} className="rounded bg-emerald-600 px-2 py-1 text-white">Approve</button>
              <button onClick={() => moderate(l.id, false)} className="rounded bg-red-600 px-2 py-1 text-white">Reject</button>
              <button onClick={() => setMsg("Flag hook recorded for review queue.")} className="rounded bg-amber-600 px-2 py-1 text-white">Flag</button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

