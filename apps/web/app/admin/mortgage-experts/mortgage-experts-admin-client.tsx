"use client";

import { useCallback, useState } from "react";

type Row = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  acceptedTerms: boolean;
  commissionRate: number;
  createdAt: Date | string;
  user: { email: string };
};

export function MortgageExpertsAdminClient({ initialExperts }: { initialExperts: Row[] }) {
  const [experts, setExperts] = useState(initialExperts);
  const [busy, setBusy] = useState<string | null>(null);

  const toggle = useCallback(async (id: string, isActive: boolean) => {
    setBusy(id);
    try {
      const res = await fetch("/api/admin/mortgage-experts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id, isActive }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(j.error ?? "Failed");
        return;
      }
      setExperts((prev) => prev.map((e) => (e.id === id ? { ...e, isActive } : e)));
    } finally {
      setBusy(null);
    }
  }, []);

  return (
    <div className="mt-8 overflow-x-auto rounded-xl border border-slate-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800 bg-slate-900/80 text-left text-slate-400">
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Terms</th>
            <th className="px-4 py-3">Rate</th>
            <th className="px-4 py-3">Active</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {experts.map((e) => (
            <tr key={e.id} className="border-b border-slate-800/80">
              <td className="px-4 py-3 font-medium text-slate-200">{e.name}</td>
              <td className="px-4 py-3 text-slate-400">{e.user.email}</td>
              <td className="px-4 py-3">{e.acceptedTerms ? "Yes" : "No"}</td>
              <td className="px-4 py-3 font-mono text-slate-500">{(e.commissionRate * 100).toFixed(0)}%</td>
              <td className="px-4 py-3">{e.isActive ? "Yes" : "No"}</td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  disabled={busy === e.id}
                  onClick={() => void toggle(e.id, !e.isActive)}
                  className="rounded-lg border border-amber-500/50 px-3 py-1 text-xs font-semibold text-amber-200 hover:bg-amber-500/10 disabled:opacity-50"
                >
                  {e.isActive ? "Deactivate" : "Activate"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
