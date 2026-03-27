"use client";

import { useMemo, useState } from "react";

export type PlatformLegalDisputeRow = {
  id: string;
  type: string;
  status: string;
  description: string;
  resolutionNote: string | null;
  bookingId: string | null;
  listingId: string | null;
  fsboListingId: string | null;
  dealId: string | null;
  platformPaymentId: string | null;
  openedByUserId: string;
  targetUserId: string | null;
  createdAt: string;
  openedBy: { email: string } | null;
  targetUser: { email: string } | null;
  booking: {
    id: string;
    payment: {
      id: string;
      payoutHoldReason: string | null;
      hostPayoutReleasedAt: string | null;
    } | null;
  } | null;
};

const STATUS_OPTIONS = ["OPEN", "UNDER_REVIEW", "RESOLVED", "REJECTED"] as const;

export function PlatformLegalDisputesClient({ initialRows }: { initialRows: PlatformLegalDisputeRow[] }) {
  const [rows, setRows] = useState(initialRows);
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.id.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        (r.openedBy?.email ?? "").toLowerCase().includes(q) ||
        (r.targetUser?.email ?? "").toLowerCase().includes(q),
    );
  }, [rows, filter]);

  async function patchStatus(id: string, status: string, resolutionNote?: string) {
    setBusy(id);
    try {
      const res = await fetch("/api/admin/platform-legal-disputes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, resolutionNote }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(typeof j.error === "string" ? j.error : "Update failed");
        return;
      }
      if (j.dispute) {
        setRows((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status: j.dispute.status,
                  resolutionNote: j.dispute.resolutionNote ?? r.resolutionNote,
                }
              : r,
          ),
        );
      }
    } finally {
      setBusy(null);
    }
  }

  async function holdHostPayout(paymentId: string, disputeId: string) {
    setBusy(disputeId);
    try {
      const res = await fetch("/api/admin/host-payouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentId,
          action: "block",
          note: `platform_dispute:${disputeId}`,
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(typeof j.error === "string" ? j.error : "Hold failed");
        return;
      }
      setRows((prev) =>
        prev.map((r) =>
          r.id === disputeId && r.booking?.payment
            ? {
                ...r,
                booking: {
                  ...r.booking,
                  payment: {
                    ...r.booking.payment,
                    payoutHoldReason: j.payment?.payoutHoldReason ?? "admin_hold",
                  },
                },
              }
            : r,
        ),
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-8 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Platform &amp; legal disputes</h2>
        <p className="mt-1 text-sm text-slate-400">
          Cross-cutting cases (listing, payment, commission, reports). BNHub booking rows above stay the primary
          guest/host flow.
        </p>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by id, type, email, text…"
          className="mt-3 w-full max-w-md rounded-xl border border-slate-700 bg-slate-900/60 px-3 py-2 text-sm text-slate-200"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 text-center text-slate-500">No platform disputes.</p>
      ) : (
        <ul className="space-y-4">
          {filtered.map((d) => {
            const pay = d.booking?.payment;
            const onHold = Boolean(pay?.payoutHoldReason);
            return (
              <li key={d.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex flex-wrap justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs text-amber-400/90">
                      {d.type} · {d.status}
                    </p>
                    <p className="mt-2 text-sm text-slate-200">{d.description}</p>
                    <p className="mt-2 text-xs text-slate-500">
                      Opened {new Date(d.createdAt).toLocaleString()} · by {d.openedBy?.email ?? d.openedByUserId}
                      {d.targetUser?.email ? ` · target ${d.targetUser.email}` : ""}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-slate-600">
                      booking {d.bookingId ?? "—"} · listing {d.listingId ?? "—"} · platform payment{" "}
                      {d.platformPaymentId ?? "—"}
                    </p>
                    {d.resolutionNote ? (
                      <p className="mt-2 rounded-lg border border-slate-800 bg-slate-950/50 p-2 text-xs text-slate-400">
                        Note: {d.resolutionNote}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap gap-2">
                      {STATUS_OPTIONS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          disabled={busy === d.id || d.status === s}
                          onClick={() =>
                            patchStatus(
                              d.id,
                              s,
                              notesDraft[d.id]?.trim() ? notesDraft[d.id].trim() : undefined,
                            )
                          }
                          className="rounded-lg border border-slate-600 px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                        >
                          {s.replace("_", " ")}
                        </button>
                      ))}
                    </div>
                    {pay ? (
                      <p className="text-[11px] text-slate-500">
                        Host payout: {pay.hostPayoutReleasedAt ? "released" : "not released"}
                        {onHold ? ` · hold: ${pay.payoutHoldReason}` : ""}
                      </p>
                    ) : null}
                    {pay && !pay.hostPayoutReleasedAt ? (
                      <button
                        type="button"
                        disabled={busy === d.id || onHold}
                        onClick={() => void holdHostPayout(pay.id, d.id)}
                        className="rounded-lg bg-rose-500/15 px-3 py-1.5 text-xs font-medium text-rose-300 hover:bg-rose-500/25 disabled:opacity-40"
                      >
                        {onHold ? "Payout on hold" : "Hold BNHub host payout"}
                      </button>
                    ) : d.bookingId && !pay ? (
                      <p className="text-[11px] text-slate-600">No BNHub payment row for this booking yet.</p>
                    ) : null}
                  </div>
                </div>
                <label className="mt-3 block text-[11px] text-slate-500">
                  Resolution note (optional, sent with status change)
                  <textarea
                    value={notesDraft[d.id] ?? ""}
                    onChange={(e) => setNotesDraft((m) => ({ ...m, [d.id]: e.target.value }))}
                    rows={2}
                    className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950/60 px-2 py-1.5 text-sm text-slate-200"
                  />
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
