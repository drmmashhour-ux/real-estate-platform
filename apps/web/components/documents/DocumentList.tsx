"use client";

import { useCallback, useEffect, useState } from "react";

type Doc = {
  id: string;
  type: string;
  workflowStatus: string | null;
  templateKey: string | null;
  createdAt: string;
};

export function DocumentList({ dealId, canMutate }: { dealId: string; canMutate: boolean }) {
  const [docs, setDocs] = useState<Doc[]>([]);

  const load = useCallback(async () => {
    const res = await fetch(`/api/deals/${dealId}/documents`);
    const data = await res.json();
    if (res.ok) setDocs(data.documents ?? []);
  }, [dealId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function addDraft() {
    if (!canMutate) return;
    const res = await fetch(`/api/deals/${dealId}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "broker_draft_assistance", templateKey: "promise_to_purchase_residential_qc" }),
    });
    if (res.ok) await load();
  }

  return (
    <div>
      {canMutate && (
        <button
          type="button"
          onClick={() => void addDraft()}
          className="mb-4 rounded-lg border border-amber-500/40 px-3 py-1.5 text-xs font-medium text-amber-200 hover:bg-amber-950/40"
        >
          + Add structured draft row
        </button>
      )}
      <ul className="space-y-2">
        {docs.length === 0 ? (
          <li className="text-sm text-zinc-500">No documents yet.</li>
        ) : (
          docs.map((d) => (
            <li key={d.id} className="flex flex-wrap justify-between gap-2 rounded-lg border border-white/5 bg-black/30 px-3 py-2 text-sm">
              <span className="text-zinc-200">{d.type}</span>
              <span className="text-xs text-zinc-500">
                {d.workflowStatus ?? "—"} {d.templateKey ? `· ${d.templateKey}` : ""}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
