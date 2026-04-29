"use client";

import { useState } from "react";
import type { ComplianceCaseView, ComplianceFindingView } from "@/types/compliance-cases-client";
import { ComplianceCaseCard } from "./ComplianceCaseCard";
import { ComplianceFindingPanel } from "./ComplianceFindingPanel";

type CaseRow = ComplianceCaseView & {
  complianceFindings: ComplianceFindingView[];
  deal: { id: string; dealCode: string | null; status: string; brokerId: string | null } | null;
};

export function ComplianceCaseQueue({ cases }: { cases: CaseRow[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(cases[0]?.id ?? null);
  const selected = cases.find((c) => c.id === selectedId) ?? null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Open compliance cases</h2>
        <div className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
          {cases.length === 0 ? (
            <p className="text-sm text-zinc-500">No cases in this view. Run the rule engine on deals to populate.</p>
          ) : (
            cases.map((c) => (
              <ComplianceCaseCard key={c.id} row={c} selected={selectedId === c.id} onSelect={setSelectedId} />
            ))
          )}
        </div>
      </div>
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Findings</h2>
        <div className="mt-3">
          {selected ? (
            <ComplianceFindingPanel caseRow={selected} />
          ) : (
            <p className="text-sm text-zinc-500">Select a case to inspect rule-linked findings.</p>
          )}
        </div>
      </div>
    </div>
  );
}
