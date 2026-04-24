"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Row = {
  id: string;
  name: string;
  listingCode: string | null;
  buyerUserCode: string | null;
  demoLeadStageLabel: string;
  createdAt: string;
  contactOrigin: string | null;
  commissionEstimate: number | null;
  commissionNote?: string;
  messagesHref: string | null;
  dealId: string | null;
  leadSource: string | null;
};

export function BrokerImmoLeadsPanel({ accent = "#10b981" }: { accent?: string }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setErr(null);
    fetch("/api/lecipm/leads?leadType=immo_contact", { credentials: "same-origin" })
      .then((r) => {
        if (!r.ok) throw new Error("Could not load leads");
        return r.json();
      })
      .then((data: unknown) => {
        const list = Array.isArray(data) ? data : [];
        setRows(
          list.map((l: Record<string, unknown>) => ({
            id: String(l.id ?? ""),
            name: String(l.name ?? "—"),
            listingCode: (l.listingCode as string | null | undefined) ?? null,
            buyerUserCode: (l.buyerUserCode as string | null | undefined) ?? null,
            demoLeadStageLabel: String(l.demoLeadStageLabel ?? l.status ?? "—"),
            createdAt: String(l.createdAt ?? ""),
            contactOrigin: (l.contactOrigin as string | null | undefined) ?? null,
            commissionEstimate: typeof l.commissionEstimate === "number" ? l.commissionEstimate : null,
            commissionNote: typeof l.commissionNote === "string" ? l.commissionNote : undefined,
            messagesHref: (l.messagesHref as string | null | undefined) ?? null,
            dealId: (l.dealId as string | null | undefined) ?? null,
            leadSource: (l.leadSource as string | null | undefined) ?? null,
          }))
        );
      })
      .catch(() => {
        setErr("Something went wrong. Please try again.");
        setRows([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  if (loading) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <p className="text-sm text-slate-400">Loading ImmoContact leads…</p>
      </div>
    );
  }

  if (err) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-6">
        <p className="text-sm text-red-300">{err}</p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 p-6">
        <h3 className="mb-2 text-lg font-semibold" style={{ color: accent }}>
          ImmoContact leads
        </h3>
        <p className="text-sm text-slate-400">
          No ImmoContact conversations yet. They appear when buyers use Immo chat on a listing you represent.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold" style={{ color: accent }}>
            ImmoContact leads
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Source · listing code · buyer · status · commission estimate · messages
          </p>
        </div>
        <Link href="/dashboard/leads?leadType=immo_contact" className="text-sm font-medium hover:underline" style={{ color: accent }}>
          Open in CRM →
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2 pr-3">When</th>
              <th className="py-2 pr-3">Listing</th>
              <th className="py-2 pr-3">Buyer code</th>
              <th className="py-2 pr-3">Status</th>
              <th className="py-2 pr-3">Source</th>
              <th className="py-2 pr-3">Commission (est.)</th>
              <th className="py-2 pr-3">Deal</th>
              <th className="py-2">Messages</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-white/5 text-slate-200">
                <td className="py-2 pr-3 whitespace-nowrap text-xs text-slate-400">
                  {r.createdAt ? new Date(r.createdAt).toLocaleString() : "—"}
                </td>
                <td className="py-2 pr-3 font-mono text-xs">{r.listingCode ?? "—"}</td>
                <td className="py-2 pr-3 font-mono text-xs">{r.buyerUserCode ?? "—"}</td>
                <td className="py-2 pr-3">{r.demoLeadStageLabel}</td>
                <td className="py-2 pr-3 text-xs text-slate-400">
                  {r.contactOrigin === "IMMO_CONTACT" ? "ImmoContact" : r.leadSource ?? "—"}
                </td>
                <td className="py-2 pr-3 text-xs">
                  {r.commissionEstimate != null ? (
                    <span>${r.commissionEstimate.toLocaleString()} CAD</span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-2 pr-3">
                  {r.dealId ? (
                    <Link href={`/dashboard/deals/${r.dealId}`} className="text-xs font-medium hover:underline" style={{ color: accent }}>
                      View deal
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-500">—</span>
                  )}
                </td>
                <td className="py-2">
                  {r.messagesHref ? (
                    <Link href={r.messagesHref} className="text-xs font-medium hover:underline" style={{ color: accent }}>
                      Open thread
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-500">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
