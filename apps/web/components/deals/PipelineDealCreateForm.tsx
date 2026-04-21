"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

export function PipelineDealCreateForm() {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [listingId, setListingId] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/deals/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          listingId: listingId.trim() || null,
        }),
      });
      const data = (await res.json()) as { dealId?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed");
      if (data.dealId) router.refresh();
      setTitle("");
      setListingId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
      <label className="flex flex-1 flex-col gap-1 text-xs text-zinc-400">
        Title
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
          placeholder="Acquisition — 123 Main St"
        />
      </label>
      <label className="flex flex-1 flex-col gap-1 text-xs text-zinc-400">
        Listing ID (optional CRM)
        <input
          value={listingId}
          onChange={(e) => setListingId(e.target.value)}
          className="rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100"
          placeholder="clxx…"
        />
      </label>
      <button
        type="submit"
        disabled={busy}
        className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-medium text-black hover:bg-amber-600 disabled:opacity-50"
      >
        Create pipeline deal
      </button>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
    </form>
  );
}
