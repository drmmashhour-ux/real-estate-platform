"use client";

import { useState } from "react";

type HostRow = {
  id: string;
  userId: string;
  status: string;
  name: string;
  email: string;
  phone?: string;
  propertyType?: string;
  location?: string;
  description?: string;
  createdAt?: Date;
};

export function AdminHostsClient({
  pendingHosts,
  allHosts,
}: {
  pendingHosts: HostRow[];
  allHosts: HostRow[];
}) {
  const [hosts, setHosts] = useState(pendingHosts);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function approve(hostId: string) {
    setLoadingId(hostId);
    try {
      const res = await fetch("/api/bnhub/host/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostId }),
      });
      if (res.ok) setHosts((prev) => prev.filter((h) => h.id !== hostId));
    } finally {
      setLoadingId(null);
    }
  }

  async function reject(hostId: string) {
    setLoadingId(hostId);
    try {
      const res = await fetch("/api/bnhub/host/reject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostId }),
      });
      if (res.ok) setHosts((prev) => prev.filter((h) => h.id !== hostId));
    } finally {
      setLoadingId(null);
    }
  }

  if (hosts.length === 0) {
    return (
      <p className="mt-4 rounded-lg border border-slate-700 bg-slate-800/50 p-6 text-slate-400">
        No pending applications.
      </p>
    );
  }

  return (
    <div className="mt-4 space-y-4">
      {hosts.map((h) => (
        <div
          key={h.id}
          className="rounded-xl border border-slate-700 bg-slate-800/50 p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-medium text-white">{h.name}</p>
              <p className="text-sm text-slate-400">{h.email}</p>
              {h.phone && (
                <p className="text-sm text-slate-400">{h.phone}</p>
              )}
              {h.propertyType && (
                <p className="mt-1 text-sm text-slate-500">
                  Property: {h.propertyType} · {h.location}
                </p>
              )}
              {h.description && (
                <p className="mt-2 max-w-xl text-sm text-slate-500 line-clamp-2">
                  {h.description}
                </p>
              )}
              <p className="mt-1 text-xs text-slate-600">
                Applied {h.createdAt ? new Date(h.createdAt).toLocaleDateString() : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => approve(h.id)}
                disabled={loadingId === h.id}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {loadingId === h.id ? "…" : "Approve"}
              </button>
              <button
                type="button"
                onClick={() => reject(h.id)}
                disabled={loadingId === h.id}
                className="rounded-lg bg-red-600/80 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
