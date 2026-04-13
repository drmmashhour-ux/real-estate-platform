"use client";

import { useState } from "react";

type Tx = {
  id: string;
  property_identity: { id: string; propertyUid: string; officialAddress: string };
  buyer: { id: string; name: string | null; email: string };
  seller: { id: string; name: string | null; email: string };
  broker: { id: string; name: string | null; email: string } | null;
  offer_price: number | null;
  status: string;
  frozen_by_admin: boolean;
  deposits: { id: string; amount: number; paymentStatus: string }[];
  created_at: Date;
  updated_at: Date;
};

export function AdminTransactionsClient({ initialTransactions }: { initialTransactions: Tx[] }) {
  const [txs, setTxs] = useState(initialTransactions);
  const [freezing, setFreezing] = useState<string | null>(null);

  async function toggleFreeze(id: string, current: boolean) {
    setFreezing(id);
    try {
      const res = await fetch(`/api/admin/transactions/${id}/freeze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ freeze: !current }),
      });
      if (res.ok) {
        setTxs((prev) =>
          prev.map((t) => (t.id === id ? { ...t, frozen_by_admin: !current } : t))
        );
      }
    } finally {
      setFreezing(null);
    }
  }

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-slate-700 text-slate-400">
            <th className="pb-2 pr-4">ID</th>
            <th className="pb-2 pr-4">Property</th>
            <th className="pb-2 pr-4">Buyer</th>
            <th className="pb-2 pr-4">Seller</th>
            <th className="pb-2 pr-4">Price</th>
            <th className="pb-2 pr-4">Status</th>
            <th className="pb-2 pr-4">Deposits</th>
            <th className="pb-2 pr-4">Frozen</th>
            <th className="pb-2 pr-4">Actions</th>
          </tr>
        </thead>
        <tbody>
          {txs.map((t) => (
            <tr key={t.id} className="border-b border-slate-800">
              <td className="py-2 pr-4 font-mono text-slate-300">{t.id.slice(0, 8)}…</td>
              <td className="max-w-[180px] truncate py-2 pr-4 text-slate-300" title={t.property_identity.officialAddress}>
                {t.property_identity.propertyUid}
              </td>
              <td className="py-2 pr-4 text-slate-300">{t.buyer.name || t.buyer.email}</td>
              <td className="py-2 pr-4 text-slate-300">{t.seller.name || t.seller.email}</td>
              <td className="py-2 pr-4 text-slate-300">
                {t.offer_price != null ? `$${(t.offer_price / 100).toLocaleString()}` : "—"}
              </td>
              <td className="py-2 pr-4 text-slate-300">{t.status}</td>
              <td className="py-2 pr-4 text-slate-300">
                {t.deposits.length} ({t.deposits.filter((d) => d.paymentStatus === "paid").length} paid)
              </td>
              <td className="py-2 pr-4">{t.frozen_by_admin ? "Yes" : "No"}</td>
              <td className="py-2 pr-4">
                <button
                  type="button"
                  onClick={() => toggleFreeze(t.id, t.frozen_by_admin)}
                  disabled={freezing === t.id}
                  className={t.frozen_by_admin ? "text-amber-400 hover:text-amber-300" : "text-slate-400 hover:text-slate-300"}
                >
                  {t.frozen_by_admin ? "Unfreeze" : "Freeze"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {txs.length === 0 && (
        <p className="py-8 text-center text-slate-500">No transactions.</p>
      )}
    </div>
  );
}
