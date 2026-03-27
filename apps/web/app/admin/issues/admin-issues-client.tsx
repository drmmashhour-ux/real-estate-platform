"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type IssueRow = {
  id: string;
  bookingId: string;
  issueType: string;
  description: string;
  status: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
  createdAt: string;
  listingTitle: string;
  listingId: string;
  guestName: string;
  guestEmail: string;
  hostId: string;
  refunded: boolean;
};

const PATCH_STATUSES = ["reviewing", "approved", "rejected", "resolved"] as const;

export function AdminIssuesClient({ issues }: { issues: IssueRow[] }) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);

  const openOrReviewing = issues.filter((i) => i.status === "open" || i.status === "reviewing");
  const resolved = issues.filter((i) =>
    ["approved", "rejected", "resolved", "resolved_refund", "resolved_rejected"].includes(i.status)
  );

  async function updateStatus(issueId: string, status: (typeof PATCH_STATUSES)[number]) {
    setUpdating(issueId);
    try {
      const res = await fetch(`/api/admin/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) router.refresh();
    } finally {
      setUpdating(null);
    }
  }

  return (
    <section className="mt-8 space-y-8">
      <div>
        <h2 className="text-lg font-medium text-slate-200">
          Open / In review ({openOrReviewing.length})
        </h2>
        {openOrReviewing.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No open issues.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {openOrReviewing.map((i) => (
              <li
                key={i.id}
                className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-100">
                      {i.issueType.replace(/_/g, " ")}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Booking: {i.bookingId} · {i.listingTitle}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      Guest: {i.guestName} ({i.guestEmail})
                    </p>
                    <p className="mt-2 text-slate-300">{i.description}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Reported {new Date(i.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href="/admin/users"
                      className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800"
                    >
                      Contact host
                    </Link>
                    {i.status === "open" && (
                      <button
                        type="button"
                        disabled={updating === i.id}
                        onClick={() => updateStatus(i.id, "reviewing")}
                        className="rounded-lg border border-slate-500 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                      >
                        {updating === i.id ? "…" : "Mark Reviewing"}
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={updating === i.id}
                      onClick={() => updateStatus(i.id, "approved")}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                    >
                      {updating === i.id ? "…" : "Approve"}
                    </button>
                    <button
                      type="button"
                      disabled={updating === i.id}
                      onClick={() => updateStatus(i.id, "rejected")}
                      className="rounded-lg bg-red-600/80 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-50"
                    >
                      {updating === i.id ? "…" : "Reject"}
                    </button>
                    <button
                      type="button"
                      disabled={updating === i.id}
                      onClick={() => updateStatus(i.id, "resolved")}
                      className="rounded-lg bg-slate-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-500 disabled:opacity-50"
                    >
                      {updating === i.id ? "…" : "Resolve"}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {resolved.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-slate-200">
            Resolved ({resolved.length})
          </h2>
          <ul className="mt-4 space-y-3">
            {resolved.map((i) => (
              <li
                key={i.id}
                className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-sm"
              >
                <span className="font-medium text-slate-300">
                  {i.issueType.replace(/_/g, " ")}
                </span>
                <span className="text-slate-500"> · {i.bookingId}</span>
                <span className="ml-2 rounded bg-slate-700 px-1.5 py-0.5 text-xs text-slate-300">
                  {i.status}
                  {i.refunded ? " (refunded)" : ""}
                </span>
                {i.resolvedAt && (
                  <span className="ml-2 text-xs text-slate-500">
                    {new Date(i.resolvedAt).toLocaleString()}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
