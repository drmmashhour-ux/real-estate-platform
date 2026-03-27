"use client";

import Link from "next/link";
import type { BrokerClient, BrokerClientStatus } from "@prisma/client";
import { ClientStatusBadge } from "@/components/crm/broker-crm/ClientStatusBadge";

const COLUMNS: BrokerClientStatus[] = [
  "LEAD",
  "CONTACTED",
  "QUALIFIED",
  "VIEWING",
  "NEGOTIATING",
  "UNDER_CONTRACT",
  "CLOSED",
  "LOST",
];

type Row = BrokerClient & {
  interactions: { createdAt: Date | string; type: string }[];
};

export function PipelineBoardClient({ initial }: { initial: Row[] }) {
  const byCol = new Map<BrokerClientStatus, Row[]>();
  for (const s of COLUMNS) byCol.set(s, []);
  for (const c of initial) {
    const list = byCol.get(c.status as BrokerClientStatus);
    if (list) list.push(c);
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {COLUMNS.map((col) => (
        <div
          key={col}
          className="flex w-64 shrink-0 flex-col rounded-xl border border-white/10 bg-black/25"
        >
          <div className="border-b border-white/10 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {col.replace(/_/g, " ")}
            </p>
            <p className="text-xs text-slate-600">{(byCol.get(col) ?? []).length}</p>
          </div>
          <div className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto p-2">
            {(byCol.get(col) ?? []).map((c) => {
              const last = c.interactions[0];
              return (
                <Link
                  key={c.id}
                  href={`/dashboard/broker/clients/${c.id}`}
                  className="block rounded-lg border border-white/10 bg-black/40 p-3 text-left text-sm text-slate-100 hover:border-emerald-500/30"
                >
                  <p className="font-medium text-white">{c.fullName}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {c.targetCity ?? "—"} ·{" "}
                    {c.budgetMax != null ? `≤ $${c.budgetMax.toLocaleString()}` : "No budget"}
                  </p>
                  {c.tags?.length ? (
                    <p className="mt-2 text-[10px] text-slate-500">{c.tags.join(" · ")}</p>
                  ) : null}
                  <p className="mt-2 text-[10px] text-slate-600">
                    {last
                      ? `Last: ${last.type.replace(/_/g, " ")} · ${new Date(last.createdAt).toLocaleDateString()}`
                      : "No activity"}
                  </p>
                  <div className="mt-2">
                    <ClientStatusBadge status={c.status as BrokerClientStatus} />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
