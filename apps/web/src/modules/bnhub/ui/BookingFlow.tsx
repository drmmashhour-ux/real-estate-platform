"use client";

import { useState } from "react";

export function BookingFlow({ listingId }: { listingId: string }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    setMsg(null);
    const r = await fetch("/api/bnhub/booking/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, startDate, endDate }),
    });
    const data = await r.json();
    if (!r.ok) {
      setMsg(data.error ?? "Booking failed");
      return;
    }
    setMsg(`Booking created: ${data.booking?.id ?? "ok"}`);
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-200">
      <h3 className="font-semibold text-white">Book this stay</h3>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded border border-white/20 bg-black/40 px-2 py-1" />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded border border-white/20 bg-black/40 px-2 py-1" />
      </div>
      <button onClick={submit} className="mt-3 rounded bg-emerald-600 px-3 py-1.5 text-white hover:bg-emerald-500">
        Create booking
      </button>
      {msg ? <p className="mt-2 text-xs text-slate-300">{msg}</p> : null}
    </div>
  );
}

