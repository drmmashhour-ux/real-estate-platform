"use client";

import type { ClientTrustSummary } from "@/src/modules/client-trust-experience/domain/clientExperience.types";

export function ClientSummaryCard({ summary }: { summary: ClientTrustSummary | null }) {
  if (!summary) {
    return (
      <div className="rounded-xl border border-white/10 bg-black/20 p-4">
        <p className="text-sm font-semibold text-white">At a glance</p>
        <p className="mt-2 text-xs text-slate-400">Loading summary…</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="text-sm font-semibold text-white">At a glance</p>
      <p className="mt-1 text-xs text-slate-400">Short summary from the information in this document. It is not legal advice.</p>
      <ul className="mt-3 space-y-2 text-xs text-slate-200">
        {summary.priceLine ? (
          <li>
            <span className="text-slate-500">Price: </span>
            {summary.priceLine}
          </li>
        ) : (
          <li className="text-slate-500">No price field found in this form.</li>
        )}
        {summary.conditions.length ? (
          <li>
            <span className="text-slate-500">Conditions: </span>
            {summary.conditions.join(" ")}
          </li>
        ) : null}
        {summary.keyDates.length ? (
          <li>
            <span className="text-slate-500">Dates: </span>
            {summary.keyDates.join(" · ")}
          </li>
        ) : null}
        {summary.majorDeclarations.length ? (
          <li>
            <span className="text-slate-500">Notable disclosures: </span>
            {summary.majorDeclarations.join(" · ")}
          </li>
        ) : (
          <li className="text-slate-500">No major “yes” disclosures were marked in the checklist items we highlight.</li>
        )}
      </ul>
    </div>
  );
}
