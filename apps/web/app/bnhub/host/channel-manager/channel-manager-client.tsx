"use client";

import { useCallback, useEffect, useState } from "react";

type Connection = {
  id: string;
  platform: string;
  status: string;
  connectionType: string;
  icalImportUrl: string | null;
  lastSyncAt: string | null;
  lastError: string | null;
  syncFrequencyMinutes: number;
  mappings: { listingId: string; externalListingRef: string }[];
  syncLogs: { syncType: string; status: string; message: string | null; createdAt: string }[];
};

export function ChannelManagerClient({
  listings,
}: {
  listings: { id: string; title: string }[];
}) {
  const [listingId, setListingId] = useState(listings[0]?.id ?? "");
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const [platform, setPlatform] = useState("AIRBNB");
  const [icalUrl, setIcalUrl] = useState("");
  const [exportHint, setExportHint] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    if (!listingId) return;
    setLoading(true);
    try {
      const r = await fetch(
        `/api/bnhub/host/channel-connections?listingId=${encodeURIComponent(listingId)}`
      );
      const d = await r.json();
      setConnections(Array.isArray(d.connections) ? d.connections : []);
    } catch {
      setConnections([]);
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addConnection(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const r = await fetch("/api/bnhub/host/channel-connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId,
        platform,
        connectionType: "ICAL",
        icalImportUrl: icalUrl.trim() || null,
        externalListingRef: "ical",
      }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setMsg(d.error ?? "Failed to create connection");
      return;
    }
    setIcalUrl("");
    setMsg("Connection created. Run sync to import calendar.");
    await load();
  }

  async function rotateExportToken() {
    setMsg("");
    const r = await fetch(`/api/bnhub/host/listings/${listingId}/channel-ical-token`, {
      method: "POST",
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setMsg(d.error ?? "Failed");
      return;
    }
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    setExportHint(`${origin}${d.exportPath}`);
    setMsg("Copy the export URL and paste it into Airbnb / Booking.com as your calendar link.");
  }

  async function syncOne(id: string) {
    setMsg("");
    const r = await fetch(`/api/bnhub/host/channel-connections/${id}?action=sync`, {
      method: "POST",
    });
    const d = await r.json().catch(() => ({}));
    setMsg(d.result?.message ?? (r.ok ? "Sync complete" : d.error ?? "Sync failed"));
    await load();
  }

  async function pauseConn(id: string, paused: boolean) {
    await fetch(`/api/bnhub/host/channel-connections/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: paused ? "PAUSED" : "ACTIVE" }),
    });
    await load();
  }

  if (!listings.length) {
    return <p className="text-slate-400">Create a listing first.</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <label className="text-xs font-medium text-slate-400">Listing</label>
        <select
          value={listingId}
          onChange={(e) => setListingId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
        >
          {listings.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title}
            </option>
          ))}
        </select>
      </div>

      <div className="rounded-2xl border border-amber-500/25 bg-gradient-to-br from-slate-900/80 to-black/40 p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-200/90">
          BNHub → OTA (iCal export)
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Generate a secret link. Paste it into your external platform as the &quot;export&quot; or sync URL. Do not share
          publicly.
        </p>
        <button
          type="button"
          onClick={() => void rotateExportToken()}
          className="mt-4 rounded-xl bg-amber-500/90 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400"
        >
          Generate export link
        </button>
        {exportHint && (
          <div className="mt-4 break-all rounded-lg border border-slate-700 bg-slate-950/80 p-3 font-mono text-xs text-emerald-300">
            {exportHint}
          </div>
        )}
      </div>

      <form onSubmit={addConnection} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-sm font-semibold text-white">OTA → BNHub (iCal import)</h2>
        <p className="mt-2 text-sm text-slate-400">
          Paste the private calendar URL from Airbnb, Booking.com, or Vrbo.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs text-slate-400">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
            >
              <option value="AIRBNB">Airbnb</option>
              <option value="BOOKING">Booking.com</option>
              <option value="VRBO">Vrbo</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-slate-400">iCal URL</label>
            <input
              value={icalUrl}
              onChange={(e) => setIcalUrl(e.target.value)}
              placeholder="https://..."
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"
            />
          </div>
        </div>
        <button
          type="submit"
          className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
        >
          Add connection
        </button>
      </form>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">Connections</h2>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>
        {connections.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No connections for this listing.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {connections.map((c) => (
                <li key={c.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium text-slate-200">
                      {c.platform} · {c.connectionType}
                    </span>
                    <span
                      className={
                        c.status === "ACTIVE"
                          ? "text-xs text-emerald-400"
                          : c.status === "ERROR"
                            ? "text-xs text-red-400"
                            : "text-xs text-amber-300"
                      }
                    >
                      {c.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Last sync: {c.lastSyncAt ? new Date(c.lastSyncAt).toLocaleString() : "—"}
                  </p>
                  {c.lastError && <p className="mt-2 text-xs text-red-400">{c.lastError}</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void syncOne(c.id)}
                      className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
                    >
                      Sync now
                    </button>
                    <button
                      type="button"
                      onClick={() => void pauseConn(c.id, c.status === "ACTIVE")}
                      className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
                    >
                      {c.status === "ACTIVE" ? "Pause" : "Resume"}
                    </button>
                  </div>
                  {c.syncLogs?.length > 0 && (
                    <ul className="mt-3 max-h-28 overflow-y-auto border-t border-slate-800 pt-2 text-xs text-slate-500">
                      {c.syncLogs.map((l) => (
                        <li key={l.createdAt + (l.message ?? "")}>
                          {l.status} {l.syncType} — {l.message ?? ""}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
          </ul>
        )}
      </div>

      {msg && <p className="text-sm text-emerald-400">{msg}</p>}
    </div>
  );
}
