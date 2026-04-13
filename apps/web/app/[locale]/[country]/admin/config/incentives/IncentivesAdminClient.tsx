"use client";

import { useEffect, useState } from "react";

type Row = {
  id: string;
  title: string;
  description: string;
  jurisdiction: string;
  active: boolean;
  externalLink: string | null;
  notes: string | null;
  sortOrder: number;
};

export function IncentivesAdminClient() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    description: "",
    jurisdiction: "quebec",
    externalLink: "",
    notes: "",
    sortOrder: 0,
  });

  async function load() {
    const res = await fetch("/api/admin/incentives", { credentials: "same-origin" });
    const j = await res.json();
    setRows(Array.isArray(j?.incentives) ? j.incentives : []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/incentives", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({
        ...form,
        externalLink: form.externalLink || null,
        notes: form.notes || null,
      }),
    });
    setForm({ title: "", description: "", jurisdiction: "quebec", externalLink: "", notes: "", sortOrder: 0 });
    void load();
  }

  async function toggle(id: string, active: boolean) {
    await fetch(`/api/admin/incentives/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ active: !active }),
    });
    void load();
  }

  if (loading) return <p className="text-slate-400">Loading…</p>;

  return (
    <div className="space-y-8">
      <form onSubmit={create} className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <h2 className="font-medium text-white">Add incentive / program note</h2>
        <input
          className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          required
        />
        <textarea
          className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          placeholder="Description (shown publicly when active)"
          rows={3}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          required
        />
        <div className="flex flex-wrap gap-2">
          <select
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            value={form.jurisdiction}
            onChange={(e) => setForm((f) => ({ ...f, jurisdiction: e.target.value }))}
          >
            <option value="federal">federal</option>
            <option value="provincial">provincial</option>
            <option value="quebec">quebec</option>
            <option value="municipal">municipal</option>
            <option value="other">other</option>
          </select>
          <input
            type="number"
            className="w-28 rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            value={form.sortOrder}
            onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
          />
        </div>
        <input
          className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          placeholder="External link (optional)"
          value={form.externalLink}
          onChange={(e) => setForm((f) => ({ ...f, externalLink: e.target.value }))}
        />
        <textarea
          className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          placeholder="Internal notes (optional)"
          rows={2}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        />
        <button type="submit" className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950">
          Save
        </button>
      </form>

      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.id} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-white">{r.title}</p>
                <p className="mt-1 text-sm text-slate-400">{r.description}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {r.jurisdiction} · sort {r.sortOrder} · {r.active ? "active" : "inactive"}
                </p>
              </div>
              <button
                type="button"
                className="rounded border border-slate-600 px-3 py-1 text-xs text-slate-300"
                onClick={() => void toggle(r.id, r.active)}
              >
                {r.active ? "Deactivate" : "Activate"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
