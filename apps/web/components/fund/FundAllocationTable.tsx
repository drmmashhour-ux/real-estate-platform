import React from "react";

export function FundAllocationTable({ allocations }: { allocations: any[] }) {
  if (allocations.length === 0) {
    return (
      <div className="py-10 text-center text-xs text-[#737373] border border-white/10 rounded-xl bg-black/20">
        No active allocations. Run capital allocator to deploy funds.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
      <table className="w-full text-left text-xs">
        <thead className="bg-white/5 text-[#737373]">
          <tr>
            <th className="px-4 py-3 font-bold uppercase">Deal / Listing</th>
            <th className="px-4 py-3 font-bold uppercase">Allocated Amount</th>
            <th className="px-4 py-3 font-bold uppercase text-premium-gold">Fund %</th>
            <th className="px-4 py-3 font-bold uppercase">Allocation Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {allocations.map((a) => (
            <tr key={a.id} className="hover:bg-white/5 transition-colors">
              <td className="px-4 py-3">
                <p className="font-medium text-white">{a.deal.title}</p>
                <p className="text-[10px] text-[#737373] mt-0.5">#{a.dealId.slice(0, 8)}</p>
              </td>
              <td className="px-4 py-3 font-mono text-white">${Number(a.allocatedAmount).toLocaleString()}</td>
              <td className="px-4 py-3 font-mono text-premium-gold font-bold">{(a.allocationPercent * 100).toFixed(1)}%</td>
              <td className="px-4 py-3 text-[#737373]">{new Date(a.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
