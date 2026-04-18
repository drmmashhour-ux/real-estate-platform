"use client";

export type BrokerPerformanceRowProps = {
  userId: string;
  email: string | null;
  leadsPurchased: number;
  moneySpentCad: number;
  repeatPurchaseProxy: number;
  isVip: boolean;
  lastPurchaseAt: string | null;
};

function fmtCad(n: number): string {
  return n.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
}

export function GrowthBrokerPerformancePanel({ brokers }: { brokers: BrokerPerformanceRowProps[] }) {
  return (
    <section className="rounded-xl border border-cyan-900/35 bg-cyan-950/15 p-4" data-growth-broker-performance-panel-v1>
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-300/90">Broker performance</p>
      <h3 className="mt-1 text-lg font-semibold text-zinc-100">Monetizing brokers (lead revenue)</h3>
      {brokers.length === 0 ? (
        <p className="mt-2 text-sm text-zinc-500">No broker-scoped lead revenue events yet.</p>
      ) : (
        <ul className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
          {brokers.map((b) => (
            <li
              key={b.userId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-800/80 bg-black/25 px-3 py-2"
            >
              <span className="truncate text-zinc-200">{b.email ?? b.userId.slice(0, 10)}</span>
              <span className="text-xs text-zinc-500">
                {b.leadsPurchased} buys · {fmtCad(b.moneySpentCad)}
                {b.isVip ? (
                  <span className="ml-2 rounded bg-amber-500/25 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-200">
                    VIP
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
