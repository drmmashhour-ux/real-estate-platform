"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CopyListingCodeButton } from "@/components/bnhub/CopyListingCodeButton";

type Broker = { id: string; name: string | null; email: string };
type Listing = {
  id: string;
  listingCode?: string | null;
  title: string;
  price: number;
  ownerId: string | null;
  owner: Broker | null;
  brokerAccesses: { brokerId: string; role: string; broker: Broker }[];
};

export function SharedListingsSection({ accent = "#10b981" }: { accent?: string }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [shareListingId, setShareListingId] = useState<string | null>(null);
  const [shareBrokerId, setShareBrokerId] = useState("");
  const [shareRole, setShareRole] = useState<"viewer" | "collaborator">("viewer");
  const [shareSubmitting, setShareSubmitting] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addPrice, setAddPrice] = useState("");
  const [addSubmitting, setAddSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/broker/listings", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => setListings(Array.isArray(data) ? data : []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  }, []);

  function handleGrantAccess(e: React.FormEvent) {
    e.preventDefault();
    if (!shareListingId || !shareBrokerId.trim()) return;
    setShareSubmitting(true);
    fetch(`/api/broker/listings/${shareListingId}/access`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brokerId: shareBrokerId.trim(), role: shareRole }),
      credentials: "same-origin",
    })
      .then((r) => {
        if (r.ok) {
          setShareListingId(null);
          setShareBrokerId("");
          return fetch("/api/broker/listings", { credentials: "same-origin" });
        }
        return Promise.reject(new Error("Failed"));
      })
      .then((r) => r.json())
      .then((data) => setListings(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setShareSubmitting(false));
  }

  function handleAddListing(e: React.FormEvent) {
    e.preventDefault();
    setAddSubmitting(true);
    fetch("/api/broker/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: addTitle || "New listing", price: addPrice ? Number(addPrice) : 0 }),
      credentials: "same-origin",
    })
      .then((r) => r.json())
      .then((newOne) => {
        if (newOne.id) setListings((prev) => [newOne, ...prev]);
        setAddTitle("");
        setAddPrice("");
      })
      .finally(() => setAddSubmitting(false));
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm text-slate-400">Loading shared listings…</p>
      </div>
    );
  }

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-emerald-400">Shared listings</h2>
      <p className="mb-3 text-sm text-slate-400">
        Listings you own or have access to. Share with other brokers to collaborate.
      </p>
      <form onSubmit={handleAddListing} className="mb-4 flex flex-wrap items-end gap-2">
        <input
          type="text"
          value={addTitle}
          onChange={(e) => setAddTitle(e.target.value)}
          placeholder="Listing title"
          className="rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500"
        />
        <input
          type="number"
          min={0}
          step={0.01}
          value={addPrice}
          onChange={(e) => setAddPrice(e.target.value)}
          placeholder="Price"
          className="w-24 rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
        />
        <button
          type="submit"
          disabled={addSubmitting}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: accent }}
        >
          {addSubmitting ? "Adding…" : "Add listing"}
        </button>
      </form>
      <ul className="space-y-2">
        {listings.length === 0 && (
          <li className="rounded-xl border border-white/10 bg-white/5 p-4 text-center text-sm text-slate-500">
            No listings yet. Add one above or ask a broker to share a listing with you.
          </li>
        )}
        {listings.map((l) => (
          <li
            key={l.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/5 p-3"
          >
            <div>
              <span className="font-medium text-slate-100">{l.title}</span>
              {l.listingCode ? (
                <>
                  <span className="ml-2 font-mono text-xs text-slate-500">{l.listingCode}</span>
                  <CopyListingCodeButton listingCode={l.listingCode} variant="light" className="ml-2 !inline-flex !py-1" />
                </>
              ) : null}
              <span className="ml-2 text-slate-400">${l.price}</span>
              {l.owner && (
                <span className="ml-2 text-xs text-slate-500">Owner: {l.owner.name ?? l.owner.email}</span>
              )}
              {l.brokerAccesses.length > 0 && (
                <span className="ml-2 text-xs text-slate-500">
                  Shared with {l.brokerAccesses.length} broker{l.brokerAccesses.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {shareListingId === l.id ? (
                <form onSubmit={handleGrantAccess} className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={shareBrokerId}
                    onChange={(e) => setShareBrokerId(e.target.value)}
                    placeholder="Broker user ID"
                    className="w-36 rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                  />
                  <select
                    value={shareRole}
                    onChange={(e) => setShareRole(e.target.value as "viewer" | "collaborator")}
                    className="rounded border border-slate-600 bg-slate-900 px-2 py-1 text-xs text-slate-100"
                  >
                    <option value="viewer">Viewer</option>
                    <option value="collaborator">Collaborator</option>
                  </select>
                  <button
                    type="submit"
                    disabled={shareSubmitting}
                    className="rounded px-2 py-1 text-xs font-medium text-white disabled:opacity-50"
                    style={{ backgroundColor: accent }}
                  >
                    Share
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShareListingId(null); setShareBrokerId(""); }}
                    className="rounded border border-slate-600 px-2 py-1 text-xs text-slate-400"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setShareListingId(l.id)}
                  className="rounded border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
                >
                  Share with broker
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
