"use client";

import { useCallback, useState } from "react";
import Link from "next/link";

export type BrokerRegistryTransactionsClientProps = {
  ownerType: string;
  ownerId: string;
  initialRows: Row[];
};

type Row = {
  id: string;
  contractNumber: string | null;
  buyerName: string | null;
  sellerName: string | null;
  grossPriceCents: number | null;
  commissionTotalCents: number | null;
  transactionStatus: string;
};

export function BrokerRegistryTransactionsClient({ ownerType, ownerId, initialRows }: BrokerRegistryTransactionsClientProps) {
  const [data, setData] = useState<Row[]>(initialRows);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/financial/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerType, ownerId }),
    });
    const json = (await res.json()) as { data?: Row[] };
    if (res.ok) setData(json.data ?? []);
  }, [ownerType, ownerId]);

  return (
    <div className="space-y-6 p-6 text-white">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-[#D4AF37]">Transaction records</h1>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white hover:border-[#D4AF37]/50"
            onClick={() => void refresh()}
          >
            Refresh
          </button>
          <Link href="/dashboard/broker/financial" className="text-sm text-[#D4AF37] hover:underline">
            ← Financial OS
          </Link>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[720px]">
          <thead className="bg-black">
            <tr>
              <th className="p-3 text-left text-sm font-medium text-white/80">Contract #</th>
              <th className="p-3 text-left text-sm font-medium text-white/80">Buyer</th>
              <th className="p-3 text-left text-sm font-medium text-white/80">Seller</th>
              <th className="p-3 text-left text-sm font-medium text-white/80">Price</th>
              <th className="p-3 text-left text-sm font-medium text-white/80">Commission</th>
              <th className="p-3 text-left text-sm font-medium text-white/80">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} className="border-t border-white/10 bg-black/40">
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
