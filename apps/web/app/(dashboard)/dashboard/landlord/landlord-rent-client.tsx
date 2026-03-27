"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type AppRow = {
  id: string;
  status: string;
  message: string;
  createdAt: string;
  tenant: { id: string; name: string | null; email: string | null } | null;
  listing: { id: string; title: string; listingCode: string };
};

export function LandlordRentApplications({ initial }: { initial: AppRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function decide(id: string, status: "ACCEPTED" | "REJECTED") {
    setBusy(id);
    setErr(null);
    try {
      const r = await fetch(`/api/rental/applications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ status }),
      });
      const j = (await r.json()) as { error?: string };
      if (!r.ok) throw new Error(j.error ?? "Update failed");
      router.refresh();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  if (initial.length === 0) {
    return <p className="text-sm text-slate-500">No applications yet.</p>;
  }

  return (
    <div className="space-y-4">
      {err ? <p className="text-sm text-red-400">{err}</p> : null}
      {initial.map((a) => (
        <div key={a.id} className="rounded-xl border border-white/10 bg-slate-900/50 p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium text-white">{a.listing.title}</p>
              <p className="text-xs text-slate-500">{a.listing.listingCode}</p>
            </div>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-slate-300">{a.status}</span>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            Tenant: {a.tenant?.name ?? a.tenant?.email ?? a.tenant?.id.slice(0, 8)}
          </p>
          <p className="mt-2 line-clamp-4 text-sm text-slate-300">{a.message}</p>
          {a.status === "PENDING" ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy === a.id}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                onClick={() => decide(a.id, "ACCEPTED")}
              >
                Accept (creates lease)
              </button>
              <button
                type="button"
                disabled={busy === a.id}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-200 disabled:opacity-50"
                onClick={() => decide(a.id, "REJECTED")}
              >
                Reject
              </button>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
