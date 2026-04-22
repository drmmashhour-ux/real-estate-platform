"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type WaitlistRow = {
  id: string;
  name: string;
  email: string;
  residenceName: string;
  city: string;
  phone: string | null;
  status: string;
  priority: number;
  createdAt: string;
  onboardingSentAt: string | null;
};

export function OperatorWaitlistAdminTable({
  rows,
  defaultOnboardingUrl,
}: {
  rows: WaitlistRow[];
  defaultOnboardingUrl: string;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [linkById, setLinkById] = useState<Record<string, string>>({});

  async function patch(id: string, action: "approve" | "reject" | "prioritize", priority?: number) {
    setBusyId(id);
    setFlash(null);
    try {
      const res = await fetch(`/api/admin/operator-waitlist/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...(priority !== undefined ? { priority } : {}) }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        onboardingUrl?: string;
      };
      if (!res.ok) {
        setFlash(data.error ?? "Request failed");
        return;
      }
      if (action === "approve" && data.onboardingUrl) {
        setLinkById((prev) => ({ ...prev, [id]: data.onboardingUrl! }));
        setFlash("Approved — onboarding link ready to copy.");
      } else {
        setFlash(action === "reject" ? "Rejected." : "Updated.");
      }
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {flash ? (
        <p className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-neutral-200">{flash}</p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-white/10 bg-black/40 text-xs uppercase tracking-wide text-neutral-400">
            <tr>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Residence</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                  No applications yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="bg-black/20 hover:bg-black/35">
                  <td className="px-4 py-3 font-medium text-white">{r.city}</td>
                  <td className="max-w-[200px] truncate px-4 py-3 text-neutral-200" title={r.residenceName}>
                    {r.residenceName}
                  </td>
                  <td className="px-4 py-3 text-neutral-300">
                    <div>{r.name}</div>
                    <div className="text-xs text-neutral-500">{r.email}</div>
                    {r.phone ? <div className="text-xs">{r.phone}</div> : null}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        r.status === "APPROVED"
                          ? "text-emerald-400"
                          : r.status === "REJECTED"
                            ? "text-red-400"
                            : "text-amber-200"
                      }
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-400">{r.priority}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {r.status === "PENDING" ? (
                        <>
                          <button
                            type="button"
                            disabled={busyId === r.id}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                            onClick={() => patch(r.id, "approve")}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            disabled={busyId === r.id}
                            className="rounded-lg border border-white/20 px-3 py-1.5 text-xs text-neutral-200 hover:bg-white/10 disabled:opacity-50"
                            onClick={() => patch(r.id, "reject")}
                          >
                            Reject
                          </button>
                        </>
                      ) : null}
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        className="rounded-lg bg-amber-600/90 px-3 py-1.5 text-xs font-semibold text-black hover:bg-amber-500 disabled:opacity-50"
                        onClick={() => patch(r.id, "prioritize")}
                      >
                        Prioritize
                      </button>
                      {(linkById[r.id] || r.status === "APPROVED") ? (
                        <button
                          type="button"
                          className="rounded-lg border border-emerald-500/40 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-950/50"
                          onClick={() =>
                            navigator.clipboard.writeText(linkById[r.id] ?? defaultOnboardingUrl)
                          }
                        >
                          Copy onboarding link
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
