"use client";

import { useCallback, useState } from "react";

export function DominationBulkStaysClient() {
  const [hostUserId, setHostUserId] = useState("");
  const [csvText, setCsvText] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [listingIds, setListingIds] = useState<string[]>([]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setMessage(null);
      setListingIds([]);
      setBusy(true);
      try {
        const res = await fetch("/api/admin/domination/bulk-stays", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hostUserId: hostUserId.trim(), csvText }),
        });
        const data = (await res.json()) as {
          ok?: boolean;
          created?: number;
          listingIds?: string[];
          parseErrors?: string[];
          error?: string;
        };
        if (!res.ok) {
          setMessage(data.error ?? "Request failed");
          return;
        }
        if (data.ok && typeof data.created === "number") {
          setListingIds(data.listingIds ?? []);
          const pe = data.parseErrors?.length ? ` Parse notes: ${data.parseErrors.join("; ")}` : "";
          setMessage(`Created ${data.created} draft stay(s).${pe}`);
        }
      } catch {
        setMessage("Network error");
      } finally {
        setBusy(false);
      }
    },
    [hostUserId, csvText],
  );

  return (
    <div className="rounded-2xl border border-zinc-800 bg-[#111] p-6">
      <h2 className="text-lg font-semibold text-white">Bulk draft stays (CSV)</h2>
      <p className="mt-2 text-sm text-zinc-500">
        Creates <span className="text-zinc-400">DRAFT</span> BNHUB listings for the given host user id. Host completes
        photos and verification before publish. Max 60 rows.
      </p>
      <p className="mt-2 font-mono text-xs text-zinc-500">
        Columns: title, city, address, night_price_cad, beds, baths, max_guests, country, region
      </p>
      <form onSubmit={(e) => void onSubmit(e)} className="mt-4 space-y-4">
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">Host user id</label>
          <input
            value={hostUserId}
            onChange={(e) => setHostUserId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 text-sm text-white"
            placeholder="User id (from Users admin)"
            autoComplete="off"
          />
        </div>
        <div>
          <label className="text-xs font-medium uppercase tracking-wide text-zinc-500">CSV</label>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={8}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-black px-3 py-2 font-mono text-xs text-zinc-200"
            placeholder={`title,city,address,night_price_cad,beds,baths,max_guests,country,region\nCozy loft,Montreal,123 Rue Example,129,1,1,2,CA,QC`}
          />
        </div>
        <button
          type="submit"
          disabled={busy || !hostUserId.trim() || !csvText.trim()}
          className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-500 disabled:opacity-40"
        >
          {busy ? "Importing…" : "Create draft stays"}
        </button>
      </form>
      {message ? <p className="mt-3 text-sm text-emerald-400">{message}</p> : null}
      {listingIds.length > 0 ? (
        <ul className="mt-3 max-h-40 overflow-auto text-xs text-zinc-400">
          {listingIds.map((id) => (
            <li key={id}>
              <a href={`/admin/bnhub/trust/listings/${id}`} className="text-amber-400 hover:underline">
                {id}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
