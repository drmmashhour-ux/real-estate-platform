"use client";

import { useEffect, useState } from "react";

type Req = {
  id: string;
  title: string;
  status: string;
  blockedReason: string | null;
  items: { status: string; isRequired: boolean }[];
};

export function ClosingBlockersPanel({
  dealId,
  onError,
}: {
  dealId: string;
  flags: Record<string, boolean>;
  onError: (e: string | null) => void;
}) {
  const [lines, setLines] = useState<{ id: string; title: string; label: string }[]>([]);

  useEffect(() => {
    fetch(`/api/deals/${encodeURIComponent(dealId)}/requests`, { credentials: "same-origin" })
      .then((r) => r.json())
      .then((j) => {
        if (j.error) {
          onError(j.error);
          return;
        }
        const requests = (Array.isArray(j.requests) ? j.requests : []) as Req[];
        const out: { id: string; title: string; label: string }[] = [];
        for (const r of requests) {
          if (r.status === "BLOCKED") {
            out.push({
              id: r.id,
              title: r.title,
              label: r.blockedReason ?? "Blocked — see request detail",
            });
            continue;
          }
          const reqItems = r.items ?? [];
          const required = reqItems.filter((i) => i.isRequired);
          if (!required.length) continue;
          const done = required.filter((i) => i.status === "VALIDATED").length;
          const completeness = done / required.length;
          if (completeness < 1 && ["SENT", "AWAITING_RESPONSE", "PARTIALLY_FULFILLED", "OVERDUE", "READY"].includes(r.status)) {
            out.push({
              id: r.id,
              title: r.title,
              label: `Incomplete (${Math.round(completeness * 100)}% of required items validated)`,
            });
          }
        }
        setLines(out);
      })
      .catch(() => onError("Readiness failed"));
  }, [dealId, onError]);

  if (lines.length === 0) return null;

  return (
    <section className="rounded-xl border border-red-500/30 bg-red-500/5 p-4">
      <h2 className="text-lg font-medium text-red-200">Closing attention</h2>
      <ul className="mt-2 space-y-1 text-sm text-red-100/80">
        {lines.map((l) => (
          <li key={l.id}>
            <span className="font-medium text-red-100">{l.title}</span>: {l.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
