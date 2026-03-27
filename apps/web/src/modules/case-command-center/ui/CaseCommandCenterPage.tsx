"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { CaseHeader } from "@/src/modules/case-command-center/ui/CaseHeader";
import { CaseNextActions } from "@/src/modules/case-command-center/ui/CaseNextActions";
import { CaseLegalHealth } from "@/src/modules/case-command-center/ui/CaseLegalHealth";
import { CaseDocumentsStatus } from "@/src/modules/case-command-center/ui/CaseDocumentsStatus";
import { CaseSignatureReadiness } from "@/src/modules/case-command-center/ui/CaseSignatureReadiness";
import { CaseCRMPanel } from "@/src/modules/case-command-center/ui/CaseCRMPanel";
import { CaseTimeline } from "@/src/modules/case-command-center/ui/CaseTimeline";
import { WorkflowRecommendationsCard } from "@/src/modules/autonomous-workflow-assistant/ui/WorkflowRecommendationsCard";
import { AutonomousTaskReviewPanel } from "@/src/modules/autonomous-workflow-assistant/ui/AutonomousTaskReviewPanel";
import { CaseOfferStrategySimulatorSection } from "@/components/deal/CaseOfferStrategySimulatorSection";
import { NegotiationDraftsSection } from "@/src/modules/ai-negotiation-deal-intelligence/ui/NegotiationDraftsSection";
import { NegotiationCaseSummaryCard } from "@/src/modules/case-command-center/ui/NegotiationCaseSummaryCard";
import type { CaseHealthSnapshot } from "@/src/modules/case-command-center/domain/case.types";

type OverviewData = {
  documentId: string;
  healthSnapshot: CaseHealthSnapshot;
  documents: { signatures: Array<{ signerName: string; status: string }> };
  crm: Record<string, unknown> | null;
  timeline: Array<import("@/src/modules/case-command-center/domain/case.types").CaseTimelineEvent>;
};

export const CaseCommandCenterPage = memo(function CaseCommandCenterPage({ documentId }: { documentId: string }) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [workflowSteps, setWorkflowSteps] = useState<any[]>([]);
  const [taskView, setTaskView] = useState<{
    criticalBlockers: any[];
    approvalRequired: any[];
    groups: { id: string; title: string; tasks: any[] }[];
    standalone: any[];
    resolvedRecent: any[];
  } | null>(null);

  const snapshot = useMemo(() => data?.healthSnapshot ?? null, [data]);

  const reloadWorkflowTasks = useCallback(async () => {
    const taskRes = await fetch(
      `/api/autonomous-workflow/tasks?documentId=${encodeURIComponent(documentId)}&grouped=1&includeResolved=1`,
    ).catch(() => null);
    const tv = taskRes ? await taskRes.json().catch(() => null) : null;
    setTaskView(
      tv && typeof tv === "object"
        ? {
            criticalBlockers: tv.criticalBlockers ?? [],
            approvalRequired: tv.approvalRequired ?? [],
            groups: tv.groups ?? [],
            standalone: tv.standalone ?? [],
            resolvedRecent: tv.resolvedRecent ?? [],
          }
        : null,
    );
  }, [documentId]);

  useEffect(() => {
    fetch(`/api/case-command-center/${documentId}`)
      .then((r) => r.json())
      .then((j) => setData(j))
      .catch(() => undefined);
  }, [documentId]);

  useEffect(() => {
    fetch("/api/autonomous-workflow/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId }),
    })
      .then((r) => r.json())
      .then(async (j) => {
        const steps = j.steps ?? [];
        setWorkflowSteps(steps);
        await fetch("/api/autonomous-workflow/run-safe-actions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            documentId,
            triggerType: "validation_completed",
            steps,
            resolutionSnapshot: j.resolutionSnapshot,
          }),
        }).catch(() => undefined);
        await reloadWorkflowTasks();
      })
      .catch(() => undefined);
  }, [documentId, reloadWorkflowTasks]);

  if (!data || !snapshot) return <p className="text-sm text-slate-400">Loading case overview…</p>;

  return (
    <div className="space-y-4">
      <CaseHeader snapshot={snapshot} />

      {snapshot.propertyId ? <NegotiationCaseSummaryCard listingId={snapshot.propertyId} documentId={documentId} /> : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <CaseNextActions primary={snapshot.primaryNextAction} secondary={snapshot.secondaryActions} />
          <CaseLegalHealth blockers={snapshot.blockers} warnings={snapshot.warnings} />
        </div>
        <div className="space-y-4">
          <CaseDocumentsStatus panels={snapshot.documentPanels} signatures={data.documents.signatures} />
          <CaseSignatureReadiness status={snapshot.signatureReadiness.status} checklist={snapshot.signatureReadiness.checklist} />
        </div>
      </div>

      {data.crm ? <CaseCRMPanel crm={data.crm} /> : null}

      {snapshot.propertyId ? (
        <CaseOfferStrategySimulatorSection
          listingId={snapshot.propertyId}
          listPriceCents={snapshot.listPriceCents}
          caseId={documentId}
          caseHealthSnapshot={snapshot}
        />
      ) : null}

      {snapshot.propertyId ? <NegotiationDraftsSection listingId={snapshot.propertyId} documentId={documentId} /> : null}

      <WorkflowRecommendationsCard steps={workflowSteps} />
      <AutonomousTaskReviewPanel
        documentId={documentId}
        onTasksChanged={reloadWorkflowTasks}
        criticalBlockers={taskView?.criticalBlockers ?? []}
        approvalRequired={taskView?.approvalRequired ?? []}
        groups={taskView?.groups ?? []}
        standalone={taskView?.standalone ?? []}
        resolvedRecent={taskView?.resolvedRecent ?? []}
      />
      <CaseTimeline events={data.timeline} />
    </div>
  );
});
