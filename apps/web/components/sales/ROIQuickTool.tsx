"use client";

import { useState } from "react";

export function ROIQuickTool() {
  const [leads, setLeads] = useState(20);
  const [qual, setQual] = useState(0.4);
  const [close, setClose] = useState(0.15);
  const [avgComm, setAvgComm] = useState(8000);
  const [plat, setPlat] = useState(0.15);
  const [sub, setSub] = useState(199);
  const [out, setOut] = useState<unknown>(null);

  async function run() {
    const res = await fetch("/api/roi/broker", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leadsPerMonth: leads,
        qualificationRate: qual,
        closeRate: close,
        avgGrossCommissionPerDeal: avgComm,
        platformSuccessFeePercent: plat,
        monthlySubscriptionDollars: sub,
      }),
    });
    const data = await res.json();
    setOut(data.ok ? data.result : data);
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 text-zinc-200">
      <h2 className="text-lg font-semibold text-white">Broker ROI (estimate)</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-zinc-500">
          Leads / mo
          <input
            type="number"
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm"
            value={leads}
            onChange={(e) => setLeads(Number(e.target.value))}
          />
        </label>
        <label className="text-xs text-zinc-500">
          Qualification rate
          <input
            type="number"
            step="0.01"
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm"
            value={qual}
            onChange={(e) => setQual(Number(e.target.value))}
          />
        </label>
        <label className="text-xs text-zinc-500">
          Close rate (on qualified)
          <input
            type="number"
            step="0.01"
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm"
            value={close}
            onChange={(e) => setClose(Number(e.target.value))}
          />
        </label>
        <label className="text-xs text-zinc-500">
          Avg gross commission ($)
          <input
            type="number"
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm"
            value={avgComm}
            onChange={(e) => setAvgComm(Number(e.target.value))}
          />
        </label>
        <label className="text-xs text-zinc-500">
          Platform fee on commission
          <input
            type="number"
            step="0.01"
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm"
            value={plat}
            onChange={(e) => setPlat(Number(e.target.value))}
          />
        </label>
        <label className="text-xs text-zinc-500">
          Monthly subscription ($)
          <input
            type="number"
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm"
            value={sub}
            onChange={(e) => setSub(Number(e.target.value))}
          />
        </label>
      </div>
      <button type="button" onClick={run} className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm text-white">
        Estimate
      </button>
      {out ? (
        <pre className="mt-4 max-h-64 overflow-auto rounded-lg border border-zinc-800 bg-black/40 p-3 text-xs">
          {JSON.stringify(out, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
