"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import type { BrokerClientListingKind } from "@prisma/client";

type Row = {
  id: string;
  listingId: string;
  kind: BrokerClientListingKind;
  createdAt: string;
  listingTitle: string | null;
  listingPrice: number | null;
};

export function ClientListingLinksPanel({
  clientId,
  links,
}: {
  clientId: string;
  links: Row[];
}) {
  const router = useRouter();
  const [listingId, setListingId] = useState("");
  const [kind, setKind] = useState<BrokerClientListingKind>("SAVED");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!listingId.trim()) return;
    setLoading(true);
    setErr(null);
    const res = await fetch(`/api/broker/clients/${clientId}/listings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ listingId: listingId.trim(), kind }),
    });
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    setLoading(false);
    if (!res.ok) {
      setErr(j.error ?? "Could not link");
      return;
    }
    setListingId("");
    router.refresh();
  }

  async function remove(lid: string) {
    setLoading(true);
    await fetch(`/api/broker/clients/${clientId}/listings/${encodeURIComponent(lid)}`, {
      method: "DELETE",
      credentials: "same-origin",
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="flex flex-wrap items-end gap-2">
        <label className="text-xs text-slate-500">
          Listing ID
          <input
            className="mt-1 block w-56 rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 font-mono text-xs text-white"
            value={listingId}
            onChange={(e) => setListingId(e.target.value)}
            placeholder="cuid…"
          />
        </label>
        <label className="text-xs text-slate-500">
          Kind
          <select
            className="mt-1 block rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-xs text-white"
            value={kind}
            onChange={(e) => setKind(e.target.value as BrokerClientListingKind)}
          >
            <option value="SAVED">Saved</option>
            <option value="SHARED">Shared</option>
            <option value="VIEWED">Viewed</option>
            <option value="FAVORITE">Favorite</option>
          </select>
        </label>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/15"
        >
          Link listing
        </button>
      </form>
      {err ? <p className="text-sm text-red-300">{err}</p> : null}

      <ul className="space-y-2">
        {links.map((l) => (
          <li
            key={l.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm"
          >
            <div>
              <Link href={`/listings/${l.listingId}`} className="font-medium text-emerald-300 hover:underline">
                {l.listingTitle ?? l.listingId.slice(0, 10) + "…"}
              </Link>
              <span className="ml-2 text-xs text-slate-500">
                {l.kind} ·{" "}
                {l.listingPrice != null ? `$${l.listingPrice.toLocaleString()}` : "—"}
              </span>
            </div>
            <button
              type="button"
              disabled={loading}
              onClick={() => remove(l.listingId)}
              className="text-xs text-red-300 hover:underline"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
