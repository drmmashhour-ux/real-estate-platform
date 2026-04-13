"use client";

import { useCallback, useState } from "react";

type Row = {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  acceptedTerms: boolean;
  expertVerificationStatus: string;
  commissionRate: number;
  createdAt: Date | string;
  user: { email: string };
};

export function MortgageExpertsAdminClient({ initialExperts }: { initialExperts: Row[] }) {
  const [experts, setExperts] = useState(initialExperts);
  const [busy, setBusy] = useState<string | null>(null);

  const patch = useCallback(async (id: string, body: Record<string, unknown>) => {
    setBusy(id);
    try {
      const res = await fetch("/api/admin/mortgage-experts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ id, ...body }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert((j as { error?: string }).error ?? "Failed");
        return;
      }
      if (typeof body.isActive === "boolean") {
        setExperts((prev) => prev.map((e) => (e.id === id ? { ...e, isActive: body.isActive as boolean } : e)));
      }
      if (typeof body.expertVerificationStatus === "string") {
        setExperts((prev) =>
          prev.map((e) => (e.id === id ? { ...e, expertVerificationStatus: body.expertVerificationStatus as string } : e))
        );
      }
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
            <th className="px-4 py-3">Verification</th>
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
              <td className="px-4 py-3 font-mono text-xs text-slate-300">{e.expertVerificationStatus}</td>
              <td className="px-4 py-3 font-mono text-slate-500">{(e.commissionRate * 100).toFixed(0)}%</td>
              <td className="px-4 py-3">{e.isActive ? "Yes" : "No"}</td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    disabled={busy === e.id}
                    onClick={() => void patch(e.id, { expertVerificationStatus: "verified" })}
                    className="rounded border border-emerald-500/50 px-2 py-1 text-[11px] font-semibold text-emerald-200 hover:bg-emerald-500/10 disabled:opacity-50"
                  >
                    Verify
                  </button>
                  <button
                    type="button"
                    disabled={busy === e.id}
                    onClick={() => void patch(e.id, { expertVerificationStatus: "rejected" })}
                    className="rounded border border-red-500/40 px-2 py-1 text-[11px] font-semibold text-red-200 hover:bg-red-500/10 disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={busy === e.id}
                    onClick={() => void patch(e.id, { isActive: !e.isActive })}
                    className="rounded border border-amber-500/50 px-2 py-1 text-[11px] font-semibold text-amber-200 hover:bg-amber-500/10 disabled:opacity-50"
                  >
                    {e.isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
