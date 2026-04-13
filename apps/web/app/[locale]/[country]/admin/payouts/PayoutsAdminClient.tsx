"use client";

import { useCallback, useEffect, useState } from "react";

type Row = {
  id: string;
  bookingId: string;
  amountCents: number;
  platformFeeCents: number | null;
  hostPayoutCents: number | null;
  hostPayoutReleasedAt: string | null;
  scheduledHostPayoutAt: string | null;
  payoutHoldReason: string | null;
  linkedContractId: string | null;
  linkedContractType: string | null;
  booking: {
    checkIn: string;
    guest: { email: string | null };
    listing: { title: string; id: string };
  };
};

export function PayoutsAdminClient() {
  const [bucket, setBucket] = useState<"pending" | "scheduled" | "completed">("pending");
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await fetch(`/api/admin/host-payouts?bucket=${bucket}`, { credentials: "same-origin" });
    const j = await r.json().catch(() => ({}));
    setRows(Array.isArray(j.data) ? j.data : []);
  }, [bucket]);

  useEffect(() => {
    void load();
  }, [load]);

  async function patch(paymentId: string, action: "release" | "block" | "delay") {
    const note =
      action !== "release"
        ? window.prompt(action === "block" ? "Hold reason (optional)" : "Delay note (optional)") ?? ""
        : "";
    setBusy(paymentId);
    try {
      await fetch("/api/admin/host-payouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId, action, note }),
      });
      await load();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(["pending", "scheduled", "completed"] as const).map((b) => (
          <button
            key={b}
            type="button"
            onClick={() => setBucket(b)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              bucket === b ? "bg-amber-500/20 text-amber-200" : "bg-slate-800 text-slate-400"
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-800">
        <table className="min-w-full text-left text-sm text-slate-300">
          <thead className="border-b border-slate-800 bg-slate-900/80 text-xs uppercase text-slate-500">
            <tr>
              <th className="p-2">Listing</th>
              <th className="p-2">Guest</th>
              <th className="p-2">Host payout</th>
              <th className="p-2">Scheduled</th>
              <th className="p-2">Contract</th>
              <th className="p-2">Hold</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-500">
                  No rows.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-800">
                  <td className="p-2 max-w-[140px] truncate" title={r.booking.listing.title}>
                    {r.booking.listing.title}
                  </td>
                  <td className="p-2 text-xs">{r.booking.guest.email}</td>
                  <td className="p-2">
                    ${((r.hostPayoutCents ?? 0) / 100).toFixed(2)}
                  </td>
                  <td className="p-2 text-xs text-slate-500">
                    {r.scheduledHostPayoutAt ? new Date(r.scheduledHostPayoutAt).toLocaleString() : "—"}
                  </td>
                  <td className="p-2 font-mono text-[10px]">
                    {r.linkedContractId ? (
                      <a href={`/api/contracts/${r.linkedContractId}/download`} className="text-amber-400 hover:underline">
                        {r.linkedContractType ?? r.linkedContractId.slice(0, 8)}…
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-2 text-xs text-rose-300">{r.payoutHoldReason ?? "—"}</td>
                  <td className="p-2">
                    {bucket !== "completed" ? (
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          disabled={busy === r.id}
                          onClick={() => void patch(r.id, "release")}
                          className="rounded border border-emerald-800 px-2 py-0.5 text-[11px] text-emerald-300 hover:bg-emerald-950/50"
                        >
                          Approve release
                        </button>
                        <button
                          type="button"
                          disabled={busy === r.id}
                          onClick={() => void patch(r.id, "delay")}
                          className="rounded border border-amber-800 px-2 py-0.5 text-[11px] text-amber-300"
                        >
                          Delay
                        </button>
                        <button
                          type="button"
                          disabled={busy === r.id}
                          onClick={() => void patch(r.id, "block")}
                          className="rounded border border-rose-800 px-2 py-0.5 text-[11px] text-rose-300"
                          >
                          Block
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">
                        {r.hostPayoutReleasedAt ? new Date(r.hostPayoutReleasedAt).toLocaleString() : "—"}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
