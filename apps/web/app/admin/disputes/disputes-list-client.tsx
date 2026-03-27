"use client";

import { useState } from "react";

type Dispute = {
  id: string;
  bookingId: string;
  claimant: string;
  description: string;
  status: string;
  evidenceUrls: string[];
  resolutionNotes: string | null;
  createdAt: string | Date;
  booking: { id: string; guest: { name: string | null; email: string }; listing: { title: string } };
  listing: { id: string; title: string };
};

export function DisputesListClient({
  initialDisputes,
}: {
  initialDisputes: Dispute[];
}) {
  const [disputes, setDisputes] = useState(initialDisputes);
  const [updating, setUpdating] = useState<string | null>(null);

  async function updateStatus(id: string, status: string, resolutionNotes?: string) {
    setUpdating(id);
    try {
      const res = await fetch(`/api/bnhub/disputes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, resolutionNotes }),
      });
      if (res.ok) {
        const updated = await res.json();
        setDisputes((prev) => prev.map((d) => (d.id === id ? { ...d, ...updated } : d)));
      }
    } finally {
      setUpdating(null);
    }
  }

  if (disputes.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center text-slate-500">
        No disputes.
      </div>
    );
  }

  return (
    <ul className="mt-6 space-y-4">
      {disputes.map((d) => (
        <li key={d.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex flex-wrap justify-between gap-4">
            <div>
              <p className="font-medium text-slate-100">{d.listing.title}</p>
              <p className="text-sm text-slate-400">
                Booking {d.bookingId} · Claimant: {d.claimant} · {d.booking.guest.name ?? d.booking.guest.email}
              </p>
              <p className="mt-2 text-sm text-slate-300">{d.description}</p>
              {d.evidenceUrls.length > 0 && (
                <p className="mt-1 text-xs text-slate-500">
                  Evidence: {d.evidenceUrls.join(", ")}
                </p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                Status: {d.status} · {new Date(d.createdAt as string).toLocaleString()}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {d.status === "OPEN" && (
                <button
                  type="button"
                  onClick={() => updateStatus(d.id, "UNDER_REVIEW")}
                  disabled={updating === d.id}
                  className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
                >
                  Under review
                </button>
              )}
              {(d.status === "OPEN" || d.status === "UNDER_REVIEW") && (
                <button
                  type="button"
                  onClick={() => updateStatus(d.id, "RESOLVED", "Resolved by admin")}
                  disabled={updating === d.id}
                  className="rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50"
                >
                  Resolve
                </button>
              )}
              <button
                type="button"
                onClick={() => updateStatus(d.id, "CLOSED")}
                disabled={updating === d.id}
                className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-slate-800 disabled:opacity-50"
              >
                Close
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
