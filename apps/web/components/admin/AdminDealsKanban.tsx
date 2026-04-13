"use client";

import Link from "next/link";

/** Canonical pipeline order from `Deal.status` (schema comment). */
const STATUS_ORDER = [
  "initiated",
  "offer_submitted",
  "accepted",
  "inspection",
  "financing",
  "closing_scheduled",
  "closed",
  "cancelled",
] as const;

export type KanbanDeal = {
  id: string;
  dealCode: string | null;
  status: string;
  priceCents: number;
  updatedAt: string;
  buyer: { name: string | null; email: string | null };
  seller: { name: string | null; email: string | null };
  broker: { name: string | null; email: string | null } | null;
};

function labelForStatus(s: string) {
  return s.replace(/_/g, " ");
}

export function AdminDealsKanban({ deals }: { deals: KanbanDeal[] }) {
  const byStatus = new Map<string, KanbanDeal[]>();
  for (const d of deals) {
    const key = d.status || "unknown";
    const arr = byStatus.get(key) ?? [];
    arr.push(d);
    byStatus.set(key, arr);
  }

  const orderSet = new Set<string>(STATUS_ORDER);
  const columns = STATUS_ORDER.filter((s) => (byStatus.get(s)?.length ?? 0) > 0);
  const extras = [...byStatus.keys()].filter((k) => !orderSet.has(k));
  const orderedKeys = [...columns, ...extras];

  if (orderedKeys.length === 0) {
    return <p className="text-sm text-zinc-500">No deals in the database yet.</p>;
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-h-[320px] gap-4" style={{ minWidth: orderedKeys.length * 220 }}>
        {orderedKeys.map((status) => {
          const col = byStatus.get(status) ?? [];
          return (
            <div key={status} className="w-56 shrink-0 rounded-2xl border border-zinc-800 bg-[#0c0c0c]">
              <div className="border-b border-zinc-800 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{labelForStatus(status)}</p>
                <p className="text-lg font-bold text-white">{col.length}</p>
              </div>
              <ul className="max-h-[480px] space-y-2 overflow-y-auto p-2">
                {col.map((deal) => (
                  <li key={deal.id}>
                    <Link
                      href={`/dashboard/deals/${deal.id}`}
                      className="block rounded-xl border border-zinc-800/80 bg-black/50 px-3 py-2 text-left transition hover:border-zinc-600"
                    >
                      <p className="font-mono text-[10px] text-zinc-500">{deal.dealCode ?? deal.id.slice(0, 8)}</p>
                      <p className="mt-0.5 text-sm font-medium text-white">
                        ${(deal.priceCents / 100).toLocaleString()}
                      </p>
                      <p className="mt-1 line-clamp-2 text-[10px] text-zinc-500">
                        {deal.buyer.name ?? deal.buyer.email ?? "Buyer"} · {deal.seller.name ?? deal.seller.email ?? "Seller"}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DealInsightsStrip(props: {
  total: number;
  closed: number;
  highValue: number;
  withLead: number;
}) {
  const { total, closed, highValue, withLead } = props;
  const items = [
    { label: "In pipeline", value: total - closed },
    { label: "Closed (sample)", value: closed },
    { label: "≥ $500k", value: highValue },
    { label: "Lead-linked", value: withLead },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((x) => (
        <div key={x.label} className="rounded-2xl border border-zinc-800 bg-[#111] px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-zinc-500">{x.label}</p>
          <p className="mt-1 text-2xl font-semibold text-white">{x.value}</p>
        </div>
      ))}
    </div>
  );
}
