"use client";

import { useCallback, useState } from "react";
import Link from "next/link";

type Row = {
  id: string;
  contractNumber: string | null;
  buyerName: string | null;
  sellerName: string | null;
  grossPriceCents: number | null;
  commissionTotalCents: number | null;
  transactionStatus: string;
  transactionType: string;
};

export function AdminAgencyRegistryTransactionsClient() {
  const [agencyId, setAgencyId] = useState("");
  const [transactionType, setTransactionType] = useState("");
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!agencyId.trim()) {
      setData([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/financial/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerType: "agency",
          ownerId: agencyId.trim(),
          ...(transactionType.trim() ? { transactionType: transactionType.trim() } : {}),
        }),
      });
      const json = (await res.json()) as { data?: Row[] };
      if (res.ok) setData(json.data ?? []);
    } finally {
      setLoading(false);
    }
  }, [agencyId, transactionType]);

  return (
    <div className="space-y-6 p-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[#D4AF37]">Agency transaction records</h1>
        <Link href="/admin/dashboard" className="text-sm text-[#D4AF37] hover:underline">
          ← Admin
        </Link>
      </div>

      <div className="flex flex-wrap gap-3">
        <input
          className="min-w-[240px] rounded-lg border border-white/15 bg-black px-3 py-2 text-sm"
          placeholder="Agency / office owner id"
          value={agencyId}
          onChange={(e) => setAgencyId(e.target.value)}
        />
        <input
          className="min-w-[180px] rounded-lg border border-white/15 bg-black px-3 py-2 text-sm"
          placeholder="Filter transaction type"
          value={transactionType}
          onChange={(e) => setTransactionType(e.target.value)}
        />
        <button
          type="button"
          className="rounded-lg bg-[#D4AF37] px-4 py-2 text-sm font-medium text-black disabled:opacity-40"
          disabled={!agencyId.trim() || loading}
          onClick={() => void load()}
        >
          Load
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[800px]">
          <thead className="bg-black">
            <tr>
              <th className="p-3 text-left text-sm text-white/80">Type</th>
              <th className="p-3 text-left text-sm text-white/80">Contract #</th>
              <th className="p-3 text-left text-sm text-white/80">Buyer</th>
              <th className="p-3 text-left text-sm text-white/80">Seller</th>
              <th className="p-3 text-left text-sm text-white/80">Price</th>
              <th className="p-3 text-left text-sm text-white/80">Commission</th>
              <th className="p-3 text-left text-sm text-white/80">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} className="border-t border-white/10 bg-black/40">
                <td className="p-3 text-sm">{row.transactionType}</td>
                <td className="p-3 text-sm">{row.contractNumber ?? "—"}</td>
                <td className="p-3 text-sm">{row.buyerName ?? "—"}</td>
                <td className="p-3 text-sm">{row.sellerName ?? "—"}</td>
                <td className="p-3 text-sm">
                  {row.grossPriceCents != null ? (row.grossPriceCents / 100).toFixed(2) : "—"}
                </td>
                <td className="p-3 text-sm">
                  {row.commissionTotalCents != null ? (row.commissionTotalCents / 100).toFixed(2) : "—"}
                </td>
                <td className="p-3 text-sm">{row.transactionStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
