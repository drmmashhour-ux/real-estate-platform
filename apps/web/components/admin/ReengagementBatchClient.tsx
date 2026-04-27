"use client";

import { useMemo, useState } from "react";

export type ReengagementBatchRow = {
  userId: string;
  email: string;
  channel: "email" | "sms";
  sms?: string;
  subject?: string;
  body?: string;
};

type Props = { initialBatch: ReengagementBatchRow[] };

export function ReengagementBatchClient({ initialBatch }: Props) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const allIds = useMemo(() => initialBatch.map((b) => b.userId), [initialBatch]);

  const toggle = (id: string) => {
    setSelected((s) => ({ ...s, [id]: !s[id] }));
  };

  const selectedIds = allIds.filter((id) => selected[id]);

  const sendSelected = async () => {
    if (selectedIds.length === 0) {
      setStatus("Select at least one user.");
      return;
    }
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/retention/reengage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun: false, userIds: selectedIds }),
      });
      const data = (await res.json()) as { results?: { userId: string; status: string; reason?: string }[]; error?: string };
      if (!res.ok) {
        setStatus(data.error ?? `Error ${res.status}`);
        return;
      }
      const ok = (data.results ?? []).filter((r) => r.status === "sent").length;
      setStatus(`Stub send complete: ${ok} sent, ${(data.results ?? []).length} total (check server logs for EMAIL/SMS stubs).`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={loading || selectedIds.length === 0}
          onClick={sendSelected}
          className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-semibold text-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Sending…" : "Send selected (stub)"}
        </button>
        {status ? <p className="text-sm text-zinc-400">{status}</p> : null}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-800">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="w-10 px-3 py-2" />
              <th className="px-3 py-2">User</th>
              <th className="px-3 py-2">Channel</th>
              <th className="px-3 py-2">Preview</th>
            </tr>
          </thead>
          <tbody>
            {initialBatch.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                  No eligible users (inactive + consent + rate limit + not paused).
                </td>
              </tr>
            ) : (
              initialBatch.map((row) => (
                <tr key={row.userId} className="border-b border-zinc-800/80 last:border-0">
                  <td className="px-3 py-2 align-top">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-zinc-600 bg-zinc-900"
                      checked={!!selected[row.userId]}
                      onChange={() => toggle(row.userId)}
                    />
                  </td>
                  <td className="px-3 py-2 align-top">
                    <p className="font-mono text-xs text-zinc-300">{row.userId}</p>
                    <p className="text-zinc-500">{row.email}</p>
                  </td>
                  <td className="px-3 py-2 align-top text-zinc-300">{row.channel}</td>
                  <td className="px-3 py-2 text-zinc-400">
                    {row.channel === "email" ? (
                      <>
                        <p className="font-medium text-zinc-200">{row.subject}</p>
                        <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap font-sans text-xs text-zinc-500">
                          {row.body}
                        </pre>
                      </>
                    ) : (
                      <p className="whitespace-pre-wrap text-xs">{row.sms}</p>
                    )}
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
