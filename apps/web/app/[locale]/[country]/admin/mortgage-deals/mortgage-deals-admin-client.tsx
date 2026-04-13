"use client";

import { useCallback, useState } from "react";

type Deal = {
  id: string;
  dealAmount: number;
  platformShare: number;
  expertShare: number;
  commissionRate: number;
  status: string;
  adminNote: string | null;
  createdAt: string | Date;
  expert: { id: string; name: string; email: string };
  lead: {
    id: string;
    name: string;
    email: string;
    phone: string;
    pipelineStatus: string;
  };
};

export function MortgageDealsAdminClient({ initialDeals }: { initialDeals: Deal[] }) {
  const [deals, setDeals] = useState(initialDeals);
  const [edit, setEdit] = useState<Deal | null>(null);
  const [platformShare, setPlatformShare] = useState("");
  const [expertShare, setExpertShare] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [status, setStatus] = useState("adjusted");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const reload = useCallback(async () => {
    const res = await fetch("/api/admin/mortgage-deals", { credentials: "same-origin" });
    if (!res.ok) return;
    const j = (await res.json()) as { deals: Deal[] };
    setDeals(j.deals);
  }, []);

  function openEdit(d: Deal) {
    setEdit(d);
    setPlatformShare(String(d.platformShare));
    setExpertShare(String(d.expertShare));
    setAdminNote(d.adminNote ?? "");
    setStatus(d.status === "void" ? "void" : "adjusted");
    setErr("");
  }

  async function saveAdjust() {
    if (!edit) return;
    setBusy(true);
    setErr("");
    try {
      const ps = Math.round(Number.parseFloat(platformShare));
      const es = Math.round(Number.parseFloat(expertShare));
      const res = await fetch(`/api/admin/mortgage-deals/${edit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          platformShare: ps,
          expertShare: es,
          adminNote: adminNote.trim() || null,
          status,
        }),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErr(j.error ?? "Update failed");
        return;
      }
      setEdit(null);
      await reload();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 overflow-x-auto rounded-xl border border-slate-800">
      {err ? <p className="mb-2 text-sm text-red-400">{err}</p> : null}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900/80 text-left text-slate-400">
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Expert</th>
            <th className="px-4 py-3">Client</th>
            <th className="px-4 py-3">Deal $</th>
            <th className="px-4 py-3">Platform</th>
            <th className="px-4 py-3">Expert</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((d) => (
            <tr key={d.id} className="border-b border-slate-800/80">
              <td className="px-4 py-3 text-slate-500">{new Date(d.createdAt).toLocaleString()}</td>
              <td className="px-4 py-3 text-slate-200">{d.expert.name}</td>
              <td className="px-4 py-3">
                <div className="font-medium text-slate-200">{d.lead.name}</div>
                <div className="text-xs text-slate-500">{d.lead.email}</div>
              </td>
              <td className="px-4 py-3 font-mono text-slate-200">${d.dealAmount.toLocaleString()}</td>
              <td className="px-4 py-3 font-mono text-amber-200">${d.platformShare.toLocaleString()}</td>
              <td className="px-4 py-3 font-mono text-emerald-200">${d.expertShare.toLocaleString()}</td>
              <td className="px-4 py-3 capitalize text-slate-400">{d.status}</td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => openEdit(d)}
                  className="rounded-lg border border-amber-500/50 px-3 py-1 text-xs font-semibold text-amber-200 hover:bg-amber-500/10"
                >
                  Verify / adjust
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {edit ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <h2 className="text-lg font-bold text-amber-200">Adjust commission</h2>
            <p className="mt-1 text-xs text-slate-400">
              Deal total: ${edit.dealAmount.toLocaleString()} — platform + expert must equal this amount.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-slate-400">
                Platform share ($)
                <input
                  value={platformShare}
                  onChange={(e) => setPlatformShare(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </label>
              <label className="text-xs text-slate-400">
                Expert share ($)
                <input
                  value={expertShare}
                  onChange={(e) => setExpertShare(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </label>
            </div>
            <label className="mt-3 block text-xs text-slate-400">
              Admin note
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              />
            </label>
            <label className="mt-3 block text-xs text-slate-400">
              Status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              >
                <option value="adjusted">adjusted</option>
                <option value="closed">closed</option>
                <option value="void">void</option>
              </select>
            </label>
            <div className="mt-6 flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void saveAdjust()}
                className="flex-1 rounded-xl bg-amber-500 py-2 text-sm font-bold text-black disabled:opacity-50"
              >
                {busy ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setEdit(null)}
                className="rounded-xl border border-slate-600 px-4 py-2 text-sm text-slate-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
