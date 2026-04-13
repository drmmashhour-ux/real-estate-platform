"use client";

import { useEffect, useState } from "react";

export function BankCoordinationPanel({ dealId, onError }: { dealId: string; onError: (e: string | null) => void }) {
  const [data, setData] = useState<{
    coordination: { financingStatus: string; institutionName: string | null } | null;
    lenderContacts: { id: string; name: string; email: string | null }[];
    disclaimer?: string;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/deals/${encodeURIComponent(dealId)}/bank`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((j) => {
        if (j.error) onError(j.error);
        else setData(j);
      })
      .catch(() => onError("Bank coordination load failed"));
  }, [dealId, onError]);

  if (!data?.coordination && !data?.lenderContacts?.length) {
    return (
      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <h2 className="text-lg font-medium text-slate-100">Lender coordination</h2>
        <p className="mt-2 text-sm text-slate-500">No financing row yet. Update status from API or create lender contact.</p>
        {data?.disclaimer ? <p className="mt-2 text-xs text-slate-600">{data.disclaimer}</p> : null}
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <h2 className="text-lg font-medium text-slate-100">Lender coordination</h2>
      {data?.disclaimer ? <p className="mt-1 text-xs text-slate-500">{data.disclaimer}</p> : null}
      {data?.coordination ? (
        <p className="mt-2 text-sm text-slate-300">
          Status: <span className="text-amber-200">{data.coordination.financingStatus}</span>
          {data.coordination.institutionName ? ` · ${data.coordination.institutionName}` : ""}
        </p>
      ) : null}
      {data?.lenderContacts?.length ? (
        <ul className="mt-2 text-sm text-slate-400">
          {data.lenderContacts.map((c) => (
            <li key={c.id}>
              {c.name} {c.email ? `· ${c.email}` : ""}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
