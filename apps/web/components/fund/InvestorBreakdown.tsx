import React from "react";

export function InvestorBreakdown({ investors }: { investors: any[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40">
      <table className="w-full text-left text-xs">
        <thead className="bg-white/5 text-[#737373]">
          <tr>
            <th className="px-4 py-3 font-bold uppercase">Investor</th>
            <th className="px-4 py-3 font-bold uppercase">Invested</th>
            <th className="px-4 py-3 font-bold uppercase text-premium-gold">Ownership</th>
            <th className="px-4 py-3 font-bold uppercase">Joined</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {investors.map((i) => (
            <tr key={i.id} className="hover:bg-white/5 transition-colors">
              <td className="px-4 py-3">
                <p className="font-medium text-white">{i.user.name || i.user.email}</p>
                <p className="text-[10px] text-[#737373] mt-0.5">{i.user.email}</p>
              </td>
              <td className="px-4 py-3 font-mono text-white">${Number(i.investedAmount).toLocaleString()}</td>
              <td className="px-4 py-3 font-mono text-premium-gold font-bold">{(i.ownershipPercent * 100).toFixed(1)}%</td>
              <td className="px-4 py-3 text-[#737373]">{new Date(i.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
