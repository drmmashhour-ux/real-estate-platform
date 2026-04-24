import React from "react";
import { InvestmentFund } from "@prisma/client";

export function FundOverview({ fund }: { fund: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="rounded-xl border border-white/10 bg-black/40 p-4">
        <p className="text-[10px] uppercase text-[#737373] font-bold">Total Capital</p>
        <p className="mt-1 text-xl font-bold text-white">${Number(fund.totalCapital).toLocaleString()}</p>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/40 p-4">
        <p className="text-[10px] uppercase text-[#737373] font-bold">Allocated</p>
        <p className="mt-1 text-xl font-bold text-premium-gold">${Number(fund.allocatedCapital).toLocaleString()}</p>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/40 p-4">
        <p className="text-[10px] uppercase text-[#737373] font-bold">Available</p>
        <p className="mt-1 text-xl font-bold text-emerald-500">${Number(fund.availableCapital).toLocaleString()}</p>
      </div>
      <div className="rounded-xl border border-white/10 bg-black/40 p-4">
        <p className="text-[10px] uppercase text-[#737373] font-bold">Status / Mode</p>
        <div className="mt-1 flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${fund.status === "ACTIVE" ? "bg-emerald-500/20 text-emerald-500" : "bg-rose-500/20 text-rose-500"}`}>
            {fund.status}
          </span>
          <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase border border-blue-500/30">
            {fund.mode}
          </span>
        </div>
      </div>
    </div>
  );
}
