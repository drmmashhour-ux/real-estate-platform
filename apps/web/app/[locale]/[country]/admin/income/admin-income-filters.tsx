"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

const GOLD = "#C9A96E";

export function AdminIncomeFilters({
  plan,
  dateFrom,
  dateTo,
}: {
  plan?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const router = useRouter();
  const [planVal, setPlanVal] = useState(plan ?? "");
  const [fromVal, setFromVal] = useState(dateFrom ?? "");
  const [toVal, setToVal] = useState(dateTo ?? "");

  const apply = useCallback(() => {
    const p = new URLSearchParams(window.location.search);
    if (planVal) p.set("plan", planVal);
    else p.delete("plan");
    if (fromVal) p.set("dateFrom", fromVal);
    else p.delete("dateFrom");
    if (toVal) p.set("dateTo", toVal);
    else p.delete("dateTo");
    router.push(`/admin/income?${p.toString()}`);
  }, [planVal, fromVal, toVal, router]);

  const clear = useCallback(() => {
    setPlanVal("");
    setFromVal("");
    setToVal("");
    router.push("/admin/income");
  }, [router]);

  return (
    <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-400">Plan</span>
        <select
          value={planVal}
          onChange={(e) => setPlanVal(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200"
        >
          <option value="">All</option>
          <option value="design-access">Design Access</option>
          <option value="basic">Basic</option>
          <option value="pro">Pro</option>
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-400">From date</span>
        <input
          type="date"
          value={fromVal}
          onChange={(e) => setFromVal(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-slate-400">To date</span>
        <input
          type="date"
          value={toVal}
          onChange={(e) => setToVal(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200"
        />
      </label>
      <button
        type="button"
        onClick={apply}
        className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-900"
        style={{ background: GOLD }}
      >
        Filter
      </button>
      <button
        type="button"
        onClick={clear}
        className="rounded-lg border border-slate-600 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
      >
        Clear
      </button>
    </div>
  );
}
