"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { BrokerOperationalTrustPanel } from "@/components/trust-score/BrokerOperationalTrustPanel";

type DepositRow = {
  id: string;
  depositType: string;
  amountCents: number;
  currency: string;
  status: string;
  contextType: string;
};

const TYPE_LABEL: Record<string, string> = {
  earnest_money: "Earnest money",
  security_deposit_vacation_resort: "Vacation resort security deposit",
  other_trust_funds: "Other trust funds",
};

function formatMoney(cents: number, currency: string) {
  const n = cents / 100;
  return `${currency === "CAD" ? "$" : `${currency} `}${n.toLocaleString("en-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function BrokerTrustPage() {
  const [deposits, setDeposits] = useState<DepositRow[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch("/api/trust/deposits", { credentials: "same-origin" });
      const data = (await res.json()) as { success?: boolean; deposits?: DepositRow[]; error?: string };
      if (!res.ok || !data.success || !data.deposits) {
        setLoadError(data.error ?? "Could not load deposits");
        setDeposits([]);
        return;
      }
      setDeposits(data.deposits);
    } catch {
      setLoadError("Network error");
      setDeposits([]);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    const c = {
      pending_receipt: 0,
      held_in_trust: 0,
      release_requested: 0,
      disputed_frozen: 0,
    };
    for (const d of deposits) {
      if (d.status === "pending_receipt") c.pending_receipt += 1;
      if (d.status === "held_in_trust") c.held_in_trust += 1;
      if (d.status === "release_requested") c.release_requested += 1;
      if (d.status === "disputed" || d.status === "frozen") c.disputed_frozen += 1;
    }
    return c;
  }, [deposits]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#D4AF37]">Trust & Deposit Center</h1>
        <p className="text-sm text-gray-400 mt-2">
          Manage trust deposits, release requests, disputes, and compliance status. Platform tracking only — fund movements
          remain subject to brokerage policy and regulation.
        </p>
        {loadError ? <p className="mt-2 text-sm text-amber-400">{loadError}</p> : null}
      </div>

      <section className="rounded-xl border border-[#D4AF37]/25 bg-black/60 p-5">
        <h2 className="text-lg font-semibold text-[#D4AF37]">Operational trust snapshot</h2>
        <p className="mt-1 text-sm text-gray-400">
          Separate from escrow balances — this summarizes marketplace reliability signals for coaching and queues.
        </p>
        <div className="mt-4">
          <BrokerOperationalTrustPanel />
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-[#D4AF37]/30 bg-black p-4 text-white">
          <div className="text-sm text-gray-400">Pending receipt</div>
          <div className="text-2xl font-bold mt-2">{counts.pending_receipt}</div>
        </div>
        <div className="rounded-xl border border-[#D4AF37]/30 bg-black p-4 text-white">
          <div className="text-sm text-gray-400">Held in trust</div>
          <div className="text-2xl font-bold mt-2">{counts.held_in_trust}</div>
        </div>
        <div className="rounded-xl border border-[#D4AF37]/30 bg-black p-4 text-white">
          <div className="text-sm text-gray-400">Release requested</div>
          <div className="text-2xl font-bold mt-2">{counts.release_requested}</div>
        </div>
        <div className="rounded-xl border border-[#D4AF37]/30 bg-black p-4 text-white">
          <div className="text-sm text-gray-400">Disputed / frozen</div>
          <div className="text-2xl font-bold mt-2">{counts.disputed_frozen}</div>
        </div>
      </div>

      <div className="rounded-xl border border-[#D4AF37]/20 bg-black p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-lg font-semibold text-white">Deposits</h2>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => void load()}
              className="text-sm text-gray-400 underline"
            >
              Refresh
            </button>
            <Link href="/dashboard/broker/trust/create" className="text-sm text-[#D4AF37] underline">
              Record deposit
            </Link>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {deposits.length === 0 ? (
            <p className="text-sm text-gray-500">No deposits yet. Record one or connect a trust account profile.</p>
          ) : (
            deposits.map((d) => (
              <div
                key={d.id}
                className="rounded-lg border border-white/10 p-4 text-white flex items-center justify-between gap-4 flex-wrap"
              >
                <div>
                  <div className="font-medium">{TYPE_LABEL[d.depositType] ?? d.depositType}</div>
                  <div className="text-sm text-gray-400">
                    {formatMoney(d.amountCents, d.currency)} · {d.contextType}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 font-mono">{d.id}</div>
                </div>
                <div className="text-sm uppercase text-[#D4AF37]">{d.status.replace(/_/g, " ")}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
