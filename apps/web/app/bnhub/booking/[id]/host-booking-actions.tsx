"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function HostBookingActions({ bookingId, className = "" }: { bookingId: string; className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<"approve" | "decline" | null>(null);

  async function approve() {
    setLoading("approve");
    try {
      const res = await fetch(`/api/bnhub/bookings/${bookingId}/approve`, { method: "POST" });
      if (res.ok) router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function decline() {
    setLoading("decline");
    try {
      const res = await fetch(`/api/bnhub/bookings/${bookingId}/decline`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Declined by host" }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={approve}
        disabled={loading !== null}
        className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
      >
        {loading === "approve" ? "Approving…" : "Approve"}
      </button>
      <button
        type="button"
        onClick={decline}
        disabled={loading !== null}
        className="rounded-xl border border-red-500/50 px-4 py-2.5 text-sm font-medium text-red-300 hover:bg-red-500/10 disabled:opacity-50"
      >
        {loading === "decline" ? "Declining…" : "Decline"}
      </button>
    </div>
  );
}
