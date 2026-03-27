"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const tabs: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "signed", label: "Signed" },
  { key: "rejected", label: "Rejected" },
];

export function ContractsStatusTabs() {
  const sp = useSearchParams();
  const current = sp.get("status") ?? "all";

  return (
    <div className="mt-6 flex flex-wrap gap-2">
      {tabs.map((t) => {
        const active = current === t.key || (t.key === "all" && !sp.get("status"));
        const href = t.key === "all" ? "/dashboard/contracts" : `/dashboard/contracts?status=${t.key}`;
        return (
          <Link
            key={t.key}
            href={href}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              active
                ? "bg-amber-500 text-slate-950"
                : "border border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
