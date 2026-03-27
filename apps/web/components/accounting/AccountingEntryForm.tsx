"use client";

import { useState } from "react";

type Props = {
  entryType: "revenue" | "expense" | "payout";
  categories: readonly string[];
  defaultStatus?: string;
};

export function AccountingEntryForm({ entryType, categories, defaultStatus = "completed" }: Props) {
  const [category, setCategory] = useState(categories[0] ?? "");
  const [subtotal, setSubtotal] = useState("");
  const [gst, setGst] = useState("0");
  const [qst, setQst] = useState("0");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState(defaultStatus);
  const [entryDate, setEntryDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const sub = Math.round(parseFloat(subtotal || "0") * 100);
    const gstC = Math.round(parseFloat(gst || "0") * 100);
    const qstC = Math.round(parseFloat(qst || "0") * 100);
    try {
      const res = await fetch("/api/admin/accounting/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          entryType,
          category,
          subtotalCents: sub,
          gstCents: gstC,
          qstCents: qstC,
          totalCents: sub + gstC + qstC,
          status,
          notes: notes || null,
          entryDate: new Date(entryDate).toISOString(),
          sourceType: "manual",
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Failed");
      setMsg("Saved.");
      setSubtotal("");
      setNotes("");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-xs text-slate-500">Amounts in CAD. Subtotal excludes GST/QST lines.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-slate-400">Category</span>
          <select
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Entry date</span>
          <input
            type="date"
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">Subtotal ($)</span>
          <input
            type="number"
            step="0.01"
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
            value={subtotal}
            onChange={(e) => setSubtotal(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">GST ($)</span>
          <input
            type="number"
            step="0.01"
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
            value={gst}
            onChange={(e) => setGst(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-400">QST ($)</span>
          <input
            type="number"
            step="0.01"
            className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
            value={qst}
            onChange={(e) => setQst(e.target.value)}
          />
        </label>
        {entryType === "payout" ? (
          <label className="block text-sm">
            <span className="text-slate-400">Status</span>
            <select
              className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="pending">pending</option>
              <option value="completed">completed</option>
              <option value="failed">failed</option>
            </select>
          </label>
        ) : null}
      </div>
      <label className="block text-sm">
        <span className="text-slate-400">Notes</span>
        <textarea
          className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-white"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-[#C9A646] px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
      >
        {loading ? "Saving…" : "Add entry"}
      </button>
      {msg ? <p className="text-sm text-emerald-400">{msg}</p> : null}
    </form>
  );
}
