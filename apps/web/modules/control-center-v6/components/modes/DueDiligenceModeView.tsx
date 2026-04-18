"use client";

import type { CommandCenterDueDiligenceSummary } from "../../company-command-center-v6.types";
import { BoardSummaryCard } from "../shared/BoardSummaryCard";
import { DiligenceSignalList } from "../shared/DiligenceSignalList";

export function DueDiligenceModeView({ view }: { view: CommandCenterDueDiligenceSummary }) {
  return (
    <div className="space-y-6">
      <BoardSummaryCard title="Diligence summary" body={view.diligenceSummary} />
      <p className="text-[10px] text-zinc-600">
        Signals below are derived from the governance aggregate only — not speculative narratives.
      </p>
      <div className="grid gap-6 md:grid-cols-2">
        <DiligenceSignalList title="Moat / differentiation (implemented toggles)" items={view.moatSignals} />
        <DiligenceSignalList title="Governance" items={view.governanceSignals} />
        <DiligenceSignalList title="Maturity" items={view.maturitySignals} />
        <DiligenceSignalList title="Risk" items={view.riskSignals} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <DiligenceSignalList title="Open questions (data-bound)" items={view.openQuestions} />
        <DiligenceSignalList title="Evidence notes" items={view.evidenceNotes} />
      </div>
    </div>
  );
}
