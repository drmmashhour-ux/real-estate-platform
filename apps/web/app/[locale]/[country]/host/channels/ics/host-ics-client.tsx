"use client";

import { useMemo, useState } from "react";

type Listing = { id: string; title: string };

type IcsImportRow = {
  id: string;
  listingId: string;
  sourceName: string;
  icsUrl: string;
  isEnabled: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
};

type IcsFeedMeta = {
  id: string;
  token: string;
  isEnabled: boolean;
  updatedAt: string;
} | null;

export function HostIcsClient({
  listings,
  initialImports,
  initialFeeds,
  siteBase,
}: {
  listings: Listing[];
  initialImports: IcsImportRow[];
  initialFeeds: Record<string, IcsFeedMeta>;
  siteBase: string;
}) {
  const [listingId, setListingId] = useState(listings[0]?.id ?? "");
  const [imports, setImports] = useState(initialImports);
  const [feeds, setFeeds] = useState<Record<string, IcsFeedMeta>>(initialFeeds);
  const [sourceName, setSourceName] = useState("Airbnb");
  const [icsUrl, setIcsUrl] = useState("");
  const [msg, setMsg] = useState("");

  const activeFeed = listingId ? feeds[listingId] : null;

  const importsForListing = useMemo(
    () => imports.filter((i) => i.listingId === listingId),
    [imports, listingId]
  );

  function setMessage(t: string) {
    setMsg(t);
    if (t) setTimeout(() => setMsg(""), 8000);
  }

  async function ensureFeed() {
    setMessage("");
    const r = await fetch("/api/calendar/ics/feed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setMessage(d.error ?? "Could not create feed");
      return;
    }
    setFeeds((prev) => ({
      ...prev,
      [listingId]: {
        id: d.id,
        token: d.token,
        isEnabled: d.isEnabled,
        updatedAt: typeof d.updatedAt === "string" ? d.updatedAt : new Date().toISOString(),
      },
    }));
    setMessage("Feed ready — copy the URL below.");
  }

  const feedUrl =
    activeFeed && siteBase
      ? `${siteBase}/api/calendar/ics/${encodeURIComponent(activeFeed.token)}`
      : activeFeed && typeof window !== "undefined"
        ? `${window.location.origin}/api/calendar/ics/${encodeURIComponent(activeFeed.token)}`
        : "";

  async function saveImport(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const r = await fetch("/api/calendar/ics/import-source", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingId, sourceName: sourceName.trim(), icsUrl: icsUrl.trim() }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setMessage(d.error ?? "Could not save import");
      return;
    }
    setImports((prev) => [
      ...prev,
      {
        id: d.id,
        listingId,
        sourceName: d.sourceName,
        icsUrl: d.icsUrl,
        isEnabled: d.isEnabled,
        lastSyncedAt: d.lastSyncedAt ?? null,
        createdAt: typeof d.createdAt === "string" ? d.createdAt : new Date().toISOString(),
      },
    ]);
    setIcsUrl("");
    setMessage("Import source saved. Run sync to pull dates.");
  }

  async function runSync(importId: string) {
    setMessage("");
    const r = await fetch("/api/calendar/ics/import-run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ importId }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setMessage(d.error ?? "Sync failed");
      return;
    }
    setMessage(`Synced ${d.count ?? 0} events`);
    const now = new Date().toISOString();
    setImports((prev) =>
      prev.map((row) => (row.id === importId ? { ...row, lastSyncedAt: now } : row))
    );
  }

  if (!listings.length) {
    return <p className="text-zinc-400">Create a BNHub listing first.</p>;
  }

  return (
    <div className="space-y-8 text-white">
      <div>
        <label className="text-xs font-medium text-zinc-400">Listing</label>
        <select
          value={listingId}
          onChange={(e) => setListingId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
        >
          {listings.map((l) => (
            <option key={l.id} value={l.id}>
              {l.title.slice(0, 60)}
            </option>
          ))}
        </select>
      </div>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
        <h2 className="font-semibold">Export feed</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Private ICS URL for OTAs. Only the secret token appears in the path — no internal listing id.
        </p>
        <button
          type="button"
          onClick={() => void ensureFeed()}
          className="mt-3 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400"
        >
          Generate or show feed
        </button>
        {feedUrl ? (
          <div className="mt-3 break-all rounded border border-zinc-700 bg-black/40 p-2 font-mono text-xs text-emerald-300">
            {feedUrl}
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
        <h2 className="font-semibold">Import external calendar</h2>
        <p className="mt-1 text-sm text-zinc-400">Paste your platform&apos;s export / sync ICS URL.</p>
        <form onSubmit={saveImport} className="mt-4 grid gap-3">
          <input
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
            placeholder="Source name (e.g. Airbnb)"
            className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm"
          />
          <input
            value={icsUrl}
            onChange={(e) => setIcsUrl(e.target.value)}
            placeholder="https://..."
            className="rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-500"
          >
            Save import URL
          </button>
        </form>

        <ul className="mt-6 space-y-3">
          {importsForListing.map((row) => (
            <li key={row.id} className="rounded-lg border border-zinc-800 bg-black/30 p-3 text-sm">
              <div className="font-medium">{row.sourceName}</div>
              <div className="mt-1 truncate text-xs text-zinc-500">{row.icsUrl}</div>
              <div className="mt-2 text-xs text-zinc-500">
                Last sync: {row.lastSyncedAt ? new Date(row.lastSyncedAt).toLocaleString() : "—"}
              </div>
              <button
                type="button"
                onClick={() => void runSync(row.id)}
                className="mt-2 rounded bg-zinc-700 px-3 py-1 text-xs text-white hover:bg-zinc-600"
              >
                Sync now
              </button>
            </li>
          ))}
        </ul>
      </section>

      {msg ? <p className="text-sm text-emerald-400">{msg}</p> : null}
    </div>
  );
}
