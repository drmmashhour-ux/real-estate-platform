"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const GOLD = "#D4AF37";

export type SerializedBnhubPricingSuggestionRow = {
  id: string;
  date: string;
  listingTitle: string;
  currency: string;
  suggested: number;
  basePrice: number;
  demandScore: number;
  reason: string;
  status: string;
  appliedAt: string | null;
};

async function postJson(url: string, body: object): Promise<{ ok: boolean; json: unknown }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { ok: res.ok, json };
}

export function HostBnhubPricingSuggestionsPanel({ rows }: { rows: SerializedBnhubPricingSuggestionRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function run(id: string, fn: () => Promise<void>) {
    setBusyId(id);
    try {
      await fn();
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-zinc-800 bg-black/40 text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Listing</th>
            <th className="px-4 py-3">Suggested</th>
            <th className="px-4 py-3">Base</th>
            <th className="px-4 py-3">Demand</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Reason</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                No nightly rows yet — suggestions appear after the next cron run or when a booking is created.
              </td>
            </tr>
          ) : (
            rows.map((s) => {
              const loading = busyId === s.id;
              const isApplied = s.status === "applied";
              const canApprove = !isApplied && (s.status === "pending" || s.status === "rejected");
              const canReject = !isApplied && (s.status === "pending" || s.status === "approved");
              const canApply = !isApplied && s.status === "approved";

              return (
                <tr key={s.id} className="border-b border-zinc-800/80">
                  <td className="whitespace-nowrap px-4 py-3 text-zinc-300">{s.date}</td>
                  <td className="max-w-[12rem] px-4 py-3 text-white">{s.listingTitle}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: GOLD }}>
                    {s.currency} {s.suggested.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">{s.basePrice.toFixed(2)}</td>
                  <td className="px-4 py-3 text-zinc-400">{(s.demandScore * 100).toFixed(0)}%</td>
                  <td className="px-4 py-3 text-xs text-zinc-400">
                    {s.status}
                    {s.appliedAt ? (
                      <span className="mt-1 block text-zinc-600">
                        Applied {new Date(s.appliedAt).toISOString().slice(0, 16)} UTC
                      </span>
                    ) : null}
                  </td>
                  <td className="max-w-md px-4 py-3 text-xs text-zinc-500">{s.reason}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={!canApprove || loading}
                        className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-40"
                        onClick={() =>
                          run(s.id, async () => {
                            await postJson("/api/pricing/approve", { id: s.id });
                          })
                        }
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={!canReject || loading}
                        className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-800 disabled:opacity-40"
                        onClick={() =>
                          run(s.id, async () => {
                            await postJson("/api/pricing/reject", { id: s.id });
                          })
                        }
                      >
                        Reject
                      </button>
                      <button
                        type="button"
                        disabled={!canApply || loading}
                        className="rounded-lg px-2 py-1 text-xs font-semibold text-black disabled:opacity-40"
                        style={{ backgroundColor: GOLD }}
                        onClick={() =>
                          run(s.id, async () => {
                            const { ok, json } = await postJson("/api/pricing/apply", { id: s.id });
                            if (!ok) {
                              const err =
                                json && typeof json === "object" && json !== null && "error" in json
                                  ? String((json as { error?: unknown }).error ?? "")
                                  : "";
                              window.alert(err || "Request failed");
                              return;
                            }
                            const data =
                              json && typeof json === "object" && json !== null
                                ? (json as { success?: boolean; message?: string | null })
                                : {};
                            if (!data.success) {
                              window.alert(data.message?.trim() || "Apply did not complete");
                            }
                          })
                        }
                      >
                        Apply
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
