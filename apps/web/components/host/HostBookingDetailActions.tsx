"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const GOLD = "#D4AF37";

export function HostBookingDetailActions({
  bookingId,
  canCancel,
  canRefund,
  guestEmail,
}: {
  bookingId: string;
  canCancel: boolean;
  canRefund: boolean;
  guestEmail: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [refundAmount, setRefundAmount] = useState("");

  async function cancel() {
    if (!canCancel) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Host canceled from dashboard" }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Cancel failed");
      setMsg({ type: "ok", text: "Booking canceled" });
      router.refresh();
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Cancel failed" });
    } finally {
      setBusy(false);
    }
  }

  async function refund() {
    if (!canRefund) return;
    setBusy(true);
    setMsg(null);
    try {
      const body: { amount?: number; reason?: string } = { reason: "Host refund from dashboard" };
      const n = parseFloat(refundAmount);
      if (Number.isFinite(n) && n > 0) body.amount = n;
      const res = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Refund failed");
      setMsg({ type: "ok", text: "Refund issued" });
      setRefundAmount("");
      router.refresh();
    } catch (e) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Refund failed" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#111] p-5">
      <h2 className="text-sm font-semibold text-white">Actions</h2>
      {msg ? (
        <p
          className={`mt-2 text-sm ${msg.type === "ok" ? "text-emerald-400" : "text-red-400"}`}
          role="status"
        >
          {msg.text}
        </p>
      ) : null}
      <div className="mt-4 flex flex-col gap-3">
        {guestEmail ? (
          <a
            href={`mailto:${encodeURIComponent(guestEmail)}`}
            className="inline-flex justify-center rounded-xl border border-zinc-600 px-4 py-2.5 text-sm font-medium text-zinc-200 hover:bg-zinc-900"
          >
            Contact guest
          </a>
        ) : null}
        {canCancel ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => void cancel()}
            className="rounded-xl border border-red-900/60 bg-red-950/30 px-4 py-2.5 text-sm font-semibold text-red-200 hover:bg-red-950/50 disabled:opacity-50"
          >
            Cancel booking
          </button>
        ) : null}
        {canRefund ? (
          <div className="space-y-2 rounded-xl border border-zinc-800 bg-black/40 p-3">
            <p className="text-xs text-zinc-500">Optional partial refund (CAD). Leave blank for full.</p>
            <input
              type="number"
              min={0}
              step={0.01}
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              placeholder="e.g. 50.00"
              className="w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => void refund()}
              className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
              style={{ backgroundColor: GOLD }}
            >
              Issue refund
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
