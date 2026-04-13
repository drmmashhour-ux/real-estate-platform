"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type Row = {
  id: string;
  city: string;
  postalCode: string | null;
  propertyType: string;
  avgPriceCents: number;
  medianPriceCents: number | null;
  avgRentCents: number | null;
  transactions: number | null;
  inventory: number | null;
  date: string;
};

export function AdminMarketClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch("/api/admin/market-data?take=200");
    const j = await r.json();
    setRows(Array.isArray(j.rows) ? j.rows : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function submitManual(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      city: String(fd.get("city") ?? ""),
      postalCode: String(fd.get("postalCode") ?? "") || null,
      propertyType: String(fd.get("propertyType") ?? ""),
      avgPriceCents: Number(fd.get("avgPriceCents")),
      medianPriceCents: fd.get("medianPriceCents") ? Number(fd.get("medianPriceCents")) : null,
      avgRentCents: fd.get("avgRentCents") ? Number(fd.get("avgRentCents")) : null,
      transactions: fd.get("transactions") ? Number(fd.get("transactions")) : null,
      inventory: fd.get("inventory") ? Number(fd.get("inventory")) : null,
      date: String(fd.get("date") ?? ""),
    };
    const res = await fetch("/api/admin/market-data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) setMsg(j.error ?? "Save failed");
    else {
      setMsg("Saved.");
      e.currentTarget.reset();
      void load();
    }
  }

  async function uploadCsv(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const file = fd.get("file");
    if (!(file instanceof File) || file.size === 0) {
      setMsg("Choose a CSV file.");
      return;
    }
    const up = new FormData();
    up.append("file", file);
    const res = await fetch("/api/admin/market-data/import-csv", { method: "POST", body: up });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) setMsg(j.error ?? "Import failed");
    else setMsg(`Imported ${j.created ?? 0} rows.`);
    void load();
  }

  async function del(id: string) {
    if (!confirm("Delete this row?")) return;
    await fetch(`/api/admin/market-data?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    void load();
  }

  return (
    <div className="space-y-10">
      <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-6">
        <h2 className="text-lg font-medium text-white">Add row (manual)</h2>
        <p className="mt-1 text-sm text-slate-500">
          Use the same convention as listings: <strong>avgPriceCents</strong> = dollar amount × 100 (e.g. $450,000 →{" "}
          <code className="text-slate-300">45000000</code>).
        </p>
        <form onSubmit={submitManual} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <input name="city" required placeholder="City" className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
          <input name="propertyType" required placeholder="Property type" className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
          <input name="postalCode" placeholder="Postal code" className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
          <input name="avgPriceCents" type="number" required placeholder="Avg price (cents)" className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
          <input name="medianPriceCents" type="number" placeholder="Median price (cents)" className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
          <input name="avgRentCents" type="number" placeholder="Avg rent monthly (cents)" className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
          <input name="transactions" type="number" placeholder="Transactions" className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
          <input name="inventory" type="number" placeholder="Inventory" className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
          <input name="date" type="date" required className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-white" />
          <button type="submit" className="rounded bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 sm:col-span-2 lg:col-span-3">
            Save
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-6">
        <h2 className="text-lg font-medium text-white">Import CSV</h2>
        <p className="mt-1 text-sm text-slate-500">
          Header: <code className="text-slate-300">city, property_type, avgPriceCents, date</code> (optional: postal_code,
          medianPriceCents, avgRentCents, transactions, inventory). Date: YYYY-MM-DD.
        </p>
        <form onSubmit={uploadCsv} className="mt-4 flex flex-wrap items-end gap-3">
          <input type="file" name="file" accept=".csv,text/csv" className="text-sm text-slate-300" />
          <button type="submit" className="rounded border border-amber-500/50 px-4 py-2 text-sm text-amber-400">
            Upload
          </button>
        </form>
      </section>

      {msg ? <p className="text-sm text-emerald-400">{msg}</p> : null}

      <section>
        <h2 className="text-lg font-medium text-white">Recent rows</h2>
        {loading ? (
          <p className="mt-2 text-slate-500">Loading…</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full min-w-[800px] text-left text-sm text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80">
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">City</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Avg $</th>
                  <th className="px-3 py-2">Rent</th>
                  <th className="px-3 py-2">Tx / Inv</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-slate-800/80">
                    <td className="px-3 py-2">{r.date.slice(0, 10)}</td>
                    <td className="px-3 py-2">{r.city}</td>
                    <td className="px-3 py-2">{r.propertyType}</td>
                    <td className="px-3 py-2">${(r.avgPriceCents / 100).toLocaleString()}</td>
                    <td className="px-3 py-2">{r.avgRentCents != null ? `$${(r.avgRentCents / 100).toFixed(0)}/mo` : "—"}</td>
                    <td className="px-3 py-2">
                      {r.transactions ?? "—"} / {r.inventory ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      <button type="button" className="text-red-400 hover:underline" onClick={() => void del(r.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
