"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Pending = {
  id: string;
  requestedStart: string;
  requestedEnd: string;
  status: string;
  listing: { id: string; title: string; listingCode: string } | null;
  leadId: string;
};

type VisitRow = {
  id: string;
  startDateTime: string;
  endDateTime: string;
  status: string;
  listing: { id: string; title: string; listingCode: string } | null;
  visitRequest: { id: string; leadId: string };
};

export function BrokerVisitsDashboardClient() {
  const [pending, setPending] = useState<Pending[]>([]);
  const [upcoming, setUpcoming] = useState<VisitRow[]>([]);
  const [past, setPast] = useState<VisitRow[]>([]);
  const [leadSummaries, setLeadSummaries] = useState<Record<string, { guestName: string | null; guestEmail: string | null }>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleIso, setRescheduleIso] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/broker/visits", { credentials: "same-origin" });
      const j = (await res.json()) as {
        pendingRequests?: Pending[];
        upcomingVisits?: VisitRow[];
        pastVisits?: VisitRow[];
        leadSummaries?: Record<string, { guestName: string | null; guestEmail: string | null }>;
        error?: string;
      };
      if (!res.ok) throw new Error(j.error ?? "Load failed");
      setPending(Array.isArray(j.pendingRequests) ? j.pendingRequests : []);
      setUpcoming(Array.isArray(j.upcomingVisits) ? j.upcomingVisits : []);
      setPast(Array.isArray(j.pastVisits) ? j.pastVisits : []);
      setLeadSummaries(j.leadSummaries && typeof j.leadSummaries === "object" ? j.leadSummaries : {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function leadLabel(leadId: string) {
    const s = leadSummaries[leadId];
    if (!s) return "Lead";
    return s.guestName?.trim() || s.guestEmail || "Lead";
  }

  async function accept(id: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/visits/${encodeURIComponent(id)}/accept`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function reject(id: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/visits/${encodeURIComponent(id)}/reject`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Failed");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function submitReschedule(requestId: string) {
    if (!rescheduleIso.trim()) return;
    setBusy(requestId);
    try {
      const res = await fetch(`/api/visits/${encodeURIComponent(requestId)}/reschedule`, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStart: new Date(rescheduleIso).toISOString() }),
      });
      const j = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(j.error ?? "Failed");
      setRescheduleId(null);
      setRescheduleIso("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-10">
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-500">Loading…</p> : null}

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Pending requests</h2>
        <ul className="mt-3 space-y-3">
          {pending.length === 0 && !loading ? (
            <li className="rounded-xl border border-white/10 bg-black/25 px-4 py-6 text-center text-sm text-slate-500">
              No pending visit requests.
            </li>
          ) : null}
          {pending.map((p) => (
            <li key={p.id} className="rounded-xl border border-amber-500/20 bg-amber-950/20 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-medium text-white">{p.listing?.title ?? "Listing"}</p>
                  <p className="text-sm text-premium-gold">
                    <Link href={`/dashboard/crm/${p.leadId}`} className="hover:underline">
                      {leadLabel(p.leadId)}
                    </Link>
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(p.requestedStart).toLocaleString()} → {new Date(p.requestedEnd).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy === p.id}
                    onClick={() => void accept(p.id)}
                    className="rounded-lg bg-emerald-600/90 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    disabled={busy === p.id}
                    onClick={() => void reject(p.id)}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-xs text-slate-300"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRescheduleId(p.id);
                      setRescheduleIso(toDatetimeLocalValue(p.requestedStart));
                    }}
                    className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-400"
                  >
                    Reschedule
                  </button>
                </div>
              </div>
              {rescheduleId === p.id ? (
                <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-white/10 pt-3">
                  <label className="text-xs text-slate-500">
                    New start (local)
                    <input
                      type="datetime-local"
                      className="mt-1 block rounded-lg border border-white/15 bg-black/40 px-2 py-1 text-sm text-white"
                      value={rescheduleIso}
                      onChange={(e) => setRescheduleIso(e.target.value)}
                    />
                  </label>
                  <button
                    type="button"
                    disabled={busy === p.id}
                    onClick={() => void submitReschedule(p.id)}
                    className="rounded-lg bg-premium-gold px-3 py-1.5 text-xs font-semibold text-black"
                  >
                    Save new time
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Upcoming visits</h2>
        <ul className="mt-3 space-y-2">
          {upcoming.length === 0 && !loading ? (
            <li className="text-sm text-slate-500">None scheduled.</li>
          ) : null}
          {upcoming.map((v) => (
            <li key={v.id} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm">
              <span className="font-medium text-white">{v.listing?.title ?? "—"}</span>
              <span className="mx-2 text-slate-600">·</span>
              <span className="text-slate-300">{leadLabel(v.visitRequest.leadId)}</span>
              <p className="mt-1 text-xs text-slate-500">
                {new Date(v.startDateTime).toLocaleString()} — {new Date(v.endDateTime).toLocaleString()}
              </p>
              <button
                type="button"
                className="mt-2 text-xs text-premium-gold hover:underline"
                onClick={() => {
                  setRescheduleId(v.visitRequest.id);
                  setRescheduleIso(toDatetimeLocalValue(v.startDateTime));
                }}
              >
                Reschedule
              </button>
              {rescheduleId === v.visitRequest.id ? (
                <div className="mt-2 flex flex-wrap items-end gap-2">
                  <input
                    type="datetime-local"
                    className="rounded-lg border border-white/15 bg-black/40 px-2 py-1 text-sm text-white"
                    value={rescheduleIso}
                    onChange={(e) => setRescheduleIso(e.target.value)}
                  />
                  <button
                    type="button"
                    disabled={busy === v.visitRequest.id}
                    onClick={() => void submitReschedule(v.visitRequest.id)}
                    className="rounded-lg bg-premium-gold px-3 py-1.5 text-xs font-semibold text-black"
                  >
                    Save
                  </button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Past visits</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-400">
          {past.length === 0 && !loading ? <li>None yet.</li> : null}
          {past.slice(0, 20).map((v) => (
            <li key={v.id} className="flex flex-wrap justify-between gap-2 border-b border-white/5 py-2">
              <span>{v.listing?.title ?? "—"}</span>
              <span className="text-xs">{new Date(v.startDateTime).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
