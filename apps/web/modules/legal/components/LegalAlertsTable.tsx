"use client";

import { useCallback, useEffect, useState } from "react";
import { LegalRiskBadge } from "./LegalRiskBadge";

type Row = {
  id: string;
  riskLevel: string;
  status: string;
  title: string;
  entityType: string;
  entityId: string;
  createdAt: string;
};

export function LegalAlertsTable({ admin }: { admin?: boolean }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!admin) return;
    setError(null);
    try {
      const res = await fetch("/api/legal/alerts?limit=40", { credentials: "same-origin" });
      const data = (await res.json()) as { alerts?: Row[] };
      setRows(
        (data.alerts ?? []).map((a) => ({
          ...a,
          createdAt: typeof a.createdAt === "string" ? a.createdAt : String(a.createdAt),
        })),
      );
    } catch {
      setError("Could not load alerts.");
    }
  }, [admin]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!admin) return null;

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-full text-left text-xs text-slate-300">
        <thead className="border-b border-white/10 bg-black/40 text-[10px] uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-3 py-2">Risk</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Title</th>
            <th className="px-3 py-2">Entity</th>
          </tr>
        </thead>
        <tbody>
          {error ? (
            <tr>
              <td colSpan={4} className="px-3 py-4 text-red-400">
                {error}
              </td>
            </tr>
          ) : null}
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-white/5 hover:bg-white/5">
              <td className="px-3 py-2">
                {r.riskLevel === "HIGH" || r.riskLevel === "CRITICAL" || r.riskLevel === "MEDIUM" ? (
                  <LegalRiskBadge level={r.riskLevel as "MEDIUM" | "HIGH" | "CRITICAL"} />
                ) : (
                  r.riskLevel
                )}
              </td>
              <td className="px-3 py-2">{r.status}</td>
              <td className="px-3 py-2">{r.title}</td>
              <td className="px-3 py-2 font-mono text-[10px] text-slate-500">
                {r.entityType}:{r.entityId.slice(0, 8)}…
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
