"use client";

import { useEffect, useState } from "react";
import { RequestCard } from "./RequestCard";

type Req = {
  id: string;
  title: string;
  status: string;
  requestCategory: string;
  dueAt: string | null;
  items: { id: string; itemLabel: string; status: string }[];
};

export function RequestBoard({
  dealId,
  flags,
  onError,
}: {
  dealId: string;
  flags: { closingRequestValidationV1: boolean };
  onError: (e: string | null) => void;
}) {
  const [rows, setRows] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/deals/${encodeURIComponent(dealId)}/requests`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((j) => {
        if (j.error) onError(j.error);
        setRows(Array.isArray(j.requests) ? j.requests : []);
      })
      .catch(() => onError("Failed to load requests"))
      .finally(() => setLoading(false));
  }, [dealId, onError]);

  if (loading) return <p className="text-sm text-slate-500">Loading requests…</p>;
  if (rows.length === 0) return <p className="text-sm text-slate-500">No document requests yet.</p>;

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <h2 className="text-lg font-medium text-slate-100">Document requests</h2>
      <ul className="mt-3 space-y-3">
        {rows.map((r) => (
          <RequestCard key={r.id} dealId={dealId} request={r} canValidate={flags.closingRequestValidationV1} />
        ))}
      </ul>
    </section>
  );
}
