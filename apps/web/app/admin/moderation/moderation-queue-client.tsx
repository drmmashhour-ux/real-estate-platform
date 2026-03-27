"use client";

import { useState } from "react";
import Link from "next/link";

type Listing = {
  id: string;
  title: string;
  city: string;
  address: string;
  nightPriceCents: number;
  verificationDocUrl: string | null;
  owner: { id: string; name: string | null; email: string };
  _count: { reviews: number; bookings: number };
};

export function ModerationQueueClient({
  initialListings,
}: {
  initialListings: Listing[];
}) {
  const [listings, setListings] = useState(initialListings);
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [approving, setApproving] = useState<string | null>(null);

  async function handleApprove(id: string) {
    setApproving(id);
    try {
      const res = await fetch(`/api/bnhub/moderation/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.ok) setListings((prev) => prev.filter((l) => l.id !== id));
    } finally {
      setApproving(null);
    }
  }

  async function handleReject(id: string, reason: string) {
    setRejecting(id);
    try {
      const res = await fetch(`/api/bnhub/moderation/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (res.ok) setListings((prev) => prev.filter((l) => l.id !== id));
    } finally {
      setRejecting(null);
    }
  }

  if (listings.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-500">
        No listings pending verification.
      </div>
    );
  }

  return (
    <ul className="mt-6 space-y-4">
      {listings.map((l) => (
        <li key={l.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Link href={`/bnhub/${l.id}`} className="font-semibold text-slate-100 hover:text-emerald-300">
                {l.title}
              </Link>
              <p className="mt-1 text-sm text-slate-400">{l.city} · {l.address}</p>
              <p className="text-sm text-slate-500">
                Host: {l.owner.name ?? l.owner.email} · ${(l.nightPriceCents / 100).toFixed(0)}/night · {l._count.reviews} reviews
              </p>
              {l.verificationDocUrl && (
                <a href={l.verificationDocUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs text-emerald-400 hover:underline">
                  View verification doc
                </a>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleApprove(l.id)}
                disabled={approving === l.id}
                className="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50"
              >
                {approving === l.id ? "Approving…" : "Approve"}
              </button>
              <RejectButton
                listingId={l.id}
                onReject={handleReject}
                disabled={rejecting === l.id}
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

function RejectButton({
  listingId,
  onReject,
  disabled,
}: {
  listingId: string;
  onReject: (id: string, reason: string) => void;
  disabled: boolean;
}) {
  const [show, setShow] = useState(false);
  const [reason, setReason] = useState("");

  if (!show) {
    return (
      <button
        type="button"
        onClick={() => setShow(true)}
        disabled={disabled}
        className="rounded-lg border border-red-500/50 px-3 py-2 text-sm font-medium text-red-300 hover:bg-red-500/10 disabled:opacity-50"
      >
        Reject
      </button>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Rejection reason (shown to host)"
        className="rounded-lg border border-slate-600 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onReject(listingId, reason || "Does not meet verification criteria.")}
          disabled={disabled}
          className="rounded-lg bg-red-500/20 px-2 py-1 text-sm text-red-300 hover:bg-red-500/30"
        >
          Confirm reject
        </button>
        <button
          type="button"
          onClick={() => { setShow(false); setReason(""); }}
          className="rounded-lg border border-slate-600 px-2 py-1 text-sm text-slate-400"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
