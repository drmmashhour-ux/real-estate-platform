"use client";

import { useCallback, useEffect, useState } from "react";

type CalendarPayload = {
  kind: "broker_lecipm_calendar_v1";
  visits: Array<{
    id: string;
    start: string;
    end: string;
    listing: { id: string; title: string } | null;
    lead: { id: string; name: string; email: string; phone: string } | null;
  }>;
  holds: Array<{
    visitRequestId: string;
    start: string;
    end: string;
    holdExpiresAt: string | null;
    listing: { id: string; title: string } | null;
    lead: { id: string; name: string; email: string; phone: string } | null;
  }>;
};

export default function BrokerLecipmCalendarPage() {
  const [data, setData] = useState<CalendarPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blockStart, setBlockStart] = useState("");
  const [blockEnd, setBlockEnd] = useState("");

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/broker/lecipm/calendar", { cache: "no-store" });
    const j = (await res.json().catch(() => ({}))) as CalendarPayload & { error?: string };
    if (!res.ok) {
      setError((j as { error?: string }).error ?? "Failed to load");
      setData(null);
      return;
    }
    setData(j as CalendarPayload);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function addBlock() {
    setError(null);
    if (!blockStart || !blockEnd) {
      setError("Set start and end (ISO datetime)");
      return;
    }
    const res = await fetch("/api/broker/lecipm/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "time_off", start: blockStart, end: blockEnd, reason: "Calendar block" }),
    });
    if (!res.ok) {
      const d = (await res.json().catch(() => ({}))) as { error?: string };
      setError(d.error ?? "Block failed");
      return;
    }
    setBlockStart("");
    setBlockEnd("");
    void load();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 text-sm text-neutral-200">
      <div>
        <h1 className="text-lg font-semibold text-white">Visit calendar</h1>
        <p className="text-neutral-400">Upcoming LECIPM showings, pending soft holds, and time off.</p>
      </div>
      {error && <p className="text-amber-200">{error}</p>}
      <div className="space-y-2 rounded border border-white/10 p-4">
        <h2 className="text-white">Block time (time off)</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col text-xs text-neutral-400">
            Start (ISO)
            <input
              className="mt-1 rounded border border-white/20 bg-black/30 px-2 py-1 text-white"
              value={blockStart}
              onChange={(e) => setBlockStart(e.target.value)}
            />
          </label>
          <label className="flex flex-1 flex-col text-xs text-neutral-400">
            End (ISO)
            <input
              className="mt-1 rounded border border-white/20 bg-black/30 px-2 py-1 text-white"
              value={blockEnd}
              onChange={(e) => setBlockEnd(e.target.value)}
            />
          </label>
          <button type="button" onClick={addBlock} className="rounded bg-white/10 px-3 py-2 text-white hover:bg-white/20">
            Save block
          </button>
        </div>
      </div>
      <div className="space-y-3">
        <h2 className="text-base font-medium text-white">Scheduled visits</h2>
        {!data && !error && <p className="text-neutral-500">Loading…</p>}
        {data && data.visits.length === 0 && <p className="text-neutral-500">No upcoming visits in the next 30 days.</p>}
        {data?.visits.map((v) => (
          <div key={v.id} className="rounded border border-white/10 p-3">
            <p className="text-white">{v.listing?.title ?? "Listing"}</p>
            <p className="text-neutral-300">
              {v.start} → {v.end}
            </p>
            {v.lead && (
              <p className="mt-1 text-neutral-400">
                Lead: {v.lead.name} · {v.lead.email} · {v.lead.phone}
              </p>
            )}
            <a className="text-sky-300 underline" href={`mailto:${v.lead?.email ?? ""}`}>
              Email lead
            </a>
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <h2 className="text-base font-medium text-white">Pending holds (not confirmed yet)</h2>
        {data && data.holds.length === 0 && <p className="text-neutral-500">No active holds.</p>}
        {data?.holds.map((h) => (
          <div key={h.visitRequestId} className="rounded border border-amber-500/30 p-3">
            <p className="text-white">{h.listing?.title ?? "Listing"}</p>
            <p className="text-neutral-300">
              {h.start} — hold to {h.holdExpiresAt ?? "n/a"}
            </p>
            {h.lead && <p className="text-neutral-400">{h.lead.name}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
