"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type IncidentRow = {
  id: string;
  incidentCategory: string;
  description: string;
  status: string;
  severityLevel: string;
  createdAt: string;
  reporterId: string;
  reporterName: string | null;
  reporterEmail: string | null;
  accusedUserId: string | null;
  accusedUserName: string | null;
  listingId: string | null;
  listingTitle: string | null;
  listingCity: string | null;
  bookingId: string | null;
  bookingRefunded: boolean | null;
};

export function AdminTrustSafetyClient({ incidents }: { incidents: IncidentRow[] }) {
  const router = useRouter();
  const [actioning, setActioning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function doAction(
    incidentId: string,
    action: "refund" | "warn" | "suspend"
  ) {
    setActioning(incidentId);
    setError(null);
    try {
      const endpoint =
        action === "refund"
          ? "/api/admin/trust-safety/actions/refund"
          : action === "warn"
            ? "/api/admin/trust-safety/actions/warn"
            : "/api/admin/trust-safety/actions/suspend-user";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentId,
          reasonCode: action === "refund" ? "REFUND_APPROVED" : "POLICY_VIOLATION",
          notes: `Admin action: ${action}`,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? `Failed to ${action}`);
        return;
      }
      router.refresh();
    } finally {
      setActioning(null);
    }
  }

  const open = incidents.filter(
    (i) => !["RESOLVED", "CLOSED"].includes(i.status)
  );
  const closed = incidents.filter((i) =>
    ["RESOLVED", "CLOSED"].includes(i.status)
  );

  return (
    <section className="mt-8 space-y-8">
      {error && (
        <div className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}
      <div>
        <h2 className="text-lg font-medium text-slate-200">
          Open / Under review ({open.length})
        </h2>
        {open.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No open incidents.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {open.map((i) => (
              <li
                key={i.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-100">
                      {i.incidentCategory.replace(/_/g, " ")}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {i.listingTitle && (
                        <>Listing: {i.listingTitle}{i.listingCity ? ` · ${i.listingCity}` : ""}</>
                      )}
                      {i.accusedUserName && (
                        <> · Host: {i.accusedUserName}</>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Reporter: {i.reporterName ?? "—"} ({i.reporterEmail ?? "—"})
                    </p>
                    <p className="mt-2 text-slate-300">{i.description}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      {new Date(i.createdAt).toLocaleString()} · {i.status} · {i.severityLevel}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 flex-wrap gap-2">
                    {i.bookingId && !i.bookingRefunded && (
                      <button
                        type="button"
                        disabled={!!actioning}
                        onClick={() => doAction(i.id, "refund")}
                        className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-500 disabled:opacity-50"
                      >
                        {actioning === i.id ? "…" : "Refund"}
                      </button>
                    )}
                    {i.accusedUserId && (
                      <>
                        <button
                          type="button"
                          disabled={!!actioning}
                          onClick={() => doAction(i.id, "warn")}
                          className="rounded-lg border border-slate-500 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                        >
                          {actioning === i.id ? "…" : "Warn host"}
                        </button>
                        <button
                          type="button"
                          disabled={!!actioning}
                          onClick={() => doAction(i.id, "suspend")}
                          className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-900/50 disabled:opacity-50"
                        >
                          {actioning === i.id ? "…" : "Suspend account"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {closed.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-slate-200">
            Resolved / Closed ({closed.length})
          </h2>
          <ul className="mt-4 space-y-3">
            {closed.map((i) => (
              <li
                key={i.id}
                className="rounded-lg border border-slate-800/60 bg-slate-900/40 p-3 text-sm"
              >
                <span className="font-medium text-slate-300">
                  {i.incidentCategory.replace(/_/g, " ")}
                </span>
                {" · "}
                {i.listingTitle ?? "—"} · {i.status}
                <span className="ml-2 text-slate-500">
                  {new Date(i.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
