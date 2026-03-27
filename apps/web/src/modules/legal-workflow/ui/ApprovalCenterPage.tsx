"use client";

import { useEffect, useMemo, useState } from "react";
import { ApprovalQueueList } from "@/src/modules/legal-workflow/ui/ApprovalQueueList";
import { ReviewPanel } from "@/src/modules/legal-workflow/ui/ReviewPanel";
import { LegalAssistantPanel } from "@/src/modules/ai-legal-assistant/ui/LegalAssistantPanel";
import { LegalGraphSummaryCard } from "@/src/modules/legal-intelligence-graph/ui/LegalGraphSummaryCard";
import { WorkflowRecommendationsCard } from "@/src/modules/autonomous-workflow-assistant/ui/WorkflowRecommendationsCard";
import { AutonomousTaskReviewPanel } from "@/src/modules/autonomous-workflow-assistant/ui/AutonomousTaskReviewPanel";
import { AutomationActivityFeed } from "@/src/modules/autonomous-workflow-assistant/ui/AutomationActivityFeed";
import { EscalationRecommendationsPanel } from "@/src/modules/autonomous-workflow-assistant/ui/EscalationRecommendationsPanel";
import { SignatureReadinessChecklist } from "@/src/modules/autonomous-workflow-assistant/ui/SignatureReadinessChecklist";
import { NegotiationTimelineWorkspace } from "@/src/modules/negotiation-chain-engine/ui/NegotiationTimelineWorkspace";
import { generateEscalationRecommendations } from "@/src/modules/autonomous-workflow-assistant/application/generateEscalationRecommendations";
import { generateSignatureReadinessPackage } from "@/src/modules/autonomous-workflow-assistant/application/generateSignatureReadinessPackage";

type QueueItem = {
  documentId: string;
  title: string;
  property: string;
  status: string;
  riskLevel: "low" | "medium" | "high" | "unknown";
  completionPercent: number;
  updatedAt: string;
  contradictionCount: number;
  warningCount: number;
};

export function ApprovalCenterPage() {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [workflow, setWorkflow] = useState<any>(null);
  const [validation, setValidation] = useState({
    missingFields: [],
    warnings: [],
    contradictions: [],
    knowledgeRuleBlocks: [],
  } as any);
  const [knowledgeRiskHints, setKnowledgeRiskHints] = useState<Array<{ content: string; sourceTitle: string; importance: string; pageNumber: number | null }>>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [legalGraph, setLegalGraph] = useState<any>(null);
  const [workflowSteps, setWorkflowSteps] = useState<any[]>([]);
  const [taskView, setTaskView] = useState<{
    criticalBlockers: any[];
    approvalRequired: any[];
    groups: { id: string; title: string; tasks: any[] }[];
    standalone: any[];
    resolvedRecent: any[];
  } | null>(null);
  const [mobileReviewOpen, setMobileReviewOpen] = useState(false);

  async function loadQueue() {
    const res = await fetch("/api/legal-workflow/queue");
    const json = await res.json();
    setQueue(json.items ?? []);
    if (!selectedId && json.items?.length) setSelectedId(json.items[0].documentId);
  }

  async function loadWorkflow(documentId: string) {
    const res = await fetch(`/api/legal-workflow/${documentId}`);
    const json = await res.json();
    setWorkflow(json);

    const payload = (json?.document?.draftPayload ?? {}) as Record<string, unknown>;
    const valRes = await fetch("/api/seller-declaration-ai/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload }),
    });
    const val = await valRes.json();
    setValidation({
      missingFields: val.missingFields ?? [],
      warnings: val.warningFlags ?? [],
      contradictions: val.contradictionFlags ?? [],
      knowledgeRuleBlocks: val.knowledgeRuleBlocks ?? [],
    });
    const fromValidation = val.knowledgeRiskHints ?? [];
    setKnowledgeRiskHints(fromValidation);

    const blockQuery = [...(val.knowledgeRuleBlocks ?? []), ...(val.missingFields ?? [])].join(" ").slice(0, 400);
    if (!fromValidation.length && blockQuery.trim()) {
      const kRes = await fetch(`/api/knowledge/legal-context?query=${encodeURIComponent(blockQuery)}&limit=4&audience=seller`);
      const kJson = await kRes.json().catch(() => ({}));
      const extra = (kJson.chunks ?? []).map((c: { content: string; source: { title: string }; importance: string; pageNumber: number | null }) => ({
        content: c.content?.length > 500 ? `${String(c.content).slice(0, 497)}...` : String(c.content ?? ""),
        sourceTitle: c.source?.title ?? "Knowledge base",
        importance: c.importance ?? "optional",
        pageNumber: c.pageNumber ?? null,
      }));
      if (extra.length) setKnowledgeRiskHints(extra);
    }

    const cRes = await fetch(`/api/legal-workflow/${documentId}/comments`);
    const cJson = await cRes.json();
    setComments(cJson.comments ?? []);
    const g = await fetch(`/api/legal-graph/${documentId}`).then((r) => r.json()).catch(() => null);
    setLegalGraph(g);

    const ev = await fetch("/api/autonomous-workflow/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId }),
    })
      .then((r) => r.json())
      .catch(() => ({ steps: [], resolutionSnapshot: undefined }));
    setWorkflowSteps(ev.steps ?? []);

    await fetch("/api/autonomous-workflow/run-safe-actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentId,
        triggerType: "validation_completed",
        steps: ev.steps ?? [],
        resolutionSnapshot: ev.resolutionSnapshot,
      }),
    }).catch(() => undefined);

    const tv = await fetch(
      `/api/autonomous-workflow/tasks?documentId=${encodeURIComponent(documentId)}&grouped=1&includeResolved=1`,
    )
      .then((r) => r.json())
      .catch(() => null);
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

  }

  useEffect(() => {
    loadQueue().catch(() => undefined);
  }, []);

  useEffect(() => {
    if (selectedId) loadWorkflow(selectedId).catch(() => undefined);
  }, [selectedId]);

  async function updateStatus(nextStatus: string, metadata: Record<string, unknown> = {}) {
    if (!selectedId) return;
    await fetch("/api/legal-workflow/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId: selectedId, nextStatus, metadata }),
    });
    await Promise.all([loadQueue(), loadWorkflow(selectedId)]);
  }

  async function addComment(text: string, sectionKey?: string) {
    if (!selectedId) return;
    await fetch(`/api/legal-workflow/${selectedId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, sectionKey }),
    });
    await loadWorkflow(selectedId);
  }

  const selectedQueueItem = useMemo(() => queue.find((q) => q.documentId === selectedId) ?? null, [queue, selectedId]);

  const escalationItems = useMemo(
    () =>
      generateEscalationRecommendations({
        blockingIssues: legalGraph?.summary?.blockingIssues ?? [],
        contradictions: validation.contradictions ?? [],
        criticalOpen: legalGraph?.summary?.criticalOpenCount ?? (legalGraph?.summary?.fileHealth === "critical" ? 1 : 0),
      }),
    [legalGraph, validation.contradictions],
  );

  const signaturePackage = useMemo(
    () =>
      generateSignatureReadinessPackage({
        validationComplete: (validation.missingFields ?? []).length === 0,
        blockingIssues: legalGraph?.summary?.blockingIssues ?? [],
        signatureReady: legalGraph?.summary?.signatureReadiness?.ready ?? false,
        signatureReasons: legalGraph?.summary?.signatureReadiness?.reasons ?? [],
      }),
    [legalGraph, validation.missingFields],
  );

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Approval Center</h2>
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileReviewOpen(true)}
          disabled={!selectedId}
          className="rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-xs text-white disabled:opacity-40"
        >
          Open review panel
        </button>
      </div>
      <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <div>
          <ApprovalQueueList
            items={queue}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              if (typeof window !== "undefined" && window.innerWidth < 1024) setMobileReviewOpen(true);
            }}
          />
        </div>
        <div className="hidden lg:block">
          <ReviewPanel
            document={workflow?.document ?? null}
            property={selectedQueueItem?.property ?? "-"}
            validation={validation}
            sectionStatuses={workflow?.document?.validationSummary?.sectionStatuses ?? []}
            aiSummary={(workflow?.document?.aiSummary as Record<string, unknown> | null) ?? null}
            knowledgeRiskHints={knowledgeRiskHints}
            audit={workflow?.audit ?? []}
            comments={comments}
            onApprove={() => updateStatus("approved")}
            onRequestChanges={() => updateStatus("needs_changes")}
            onFlagRisk={() => updateStatus("needs_changes", { flaggedRisk: true })}
            onAddComment={addComment}
          />
          {selectedId ? (
            <div className="mt-3 space-y-3">
              {workflow?.document?.listingId ? (
                <div className="rounded-xl border border-white/10 bg-black/15 p-3">
                  <p className="mb-2 text-xs font-semibold text-white">Negotiation</p>
                  <NegotiationTimelineWorkspace
                    listingId={workflow.document.listingId as string}
                    documentId={selectedId}
                    compact
                  />
                </div>
              ) : null}
              <WorkflowRecommendationsCard steps={workflowSteps} />
              <AutonomousTaskReviewPanel
                documentId={selectedId}
                onTasksChanged={() => {
                  if (selectedId) void loadWorkflow(selectedId);
                }}
                criticalBlockers={taskView?.criticalBlockers ?? []}
                approvalRequired={taskView?.approvalRequired ?? []}
                groups={taskView?.groups ?? []}
                standalone={taskView?.standalone ?? []}
                resolvedRecent={taskView?.resolvedRecent ?? []}
                signatureReadinessSlot={
                  <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                    <p className="text-sm font-semibold text-white">Signature readiness</p>
                    <SignatureReadinessChecklist items={signaturePackage.checklist} />
                  </div>
                }
              />
              <AutomationActivityFeed documentId={selectedId} />
              <EscalationRecommendationsPanel items={escalationItems} />
              <LegalGraphSummaryCard summary={legalGraph?.summary ?? null} />
              <LegalAssistantPanel documentId={selectedId} />
            </div>
          ) : null}
        </div>
      </div>

      {mobileReviewOpen ? (
        <div className="fixed inset-0 z-40 bg-black/80 p-3 lg:hidden">
          <div className="h-full overflow-auto rounded-xl border border-white/10 bg-[#0e0f11] p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Review panel</p>
              <button type="button" onClick={() => setMobileReviewOpen(false)} className="text-xs text-slate-400">Close</button>
            </div>
            <ReviewPanel
              document={workflow?.document ?? null}
              property={selectedQueueItem?.property ?? "-"}
              validation={validation}
              sectionStatuses={workflow?.document?.validationSummary?.sectionStatuses ?? []}
              aiSummary={(workflow?.document?.aiSummary as Record<string, unknown> | null) ?? null}
              knowledgeRiskHints={knowledgeRiskHints}
              audit={workflow?.audit ?? []}
              comments={comments}
              onApprove={() => updateStatus("approved")}
              onRequestChanges={() => updateStatus("needs_changes")}
              onFlagRisk={() => updateStatus("needs_changes", { flaggedRisk: true })}
              onAddComment={addComment}
            />
            {selectedId ? (
              <div className="mt-3 space-y-3">
                {workflow?.document?.listingId ? (
                  <div className="rounded-xl border border-white/10 bg-black/15 p-3">
                    <p className="mb-2 text-xs font-semibold text-white">Negotiation</p>
                    <NegotiationTimelineWorkspace
                      listingId={workflow.document.listingId as string}
                      documentId={selectedId}
                      compact
                    />
                  </div>
                ) : null}
                <WorkflowRecommendationsCard steps={workflowSteps} />
                <AutonomousTaskReviewPanel
                  documentId={selectedId}
                  onTasksChanged={() => {
                    if (selectedId) void loadWorkflow(selectedId);
                  }}
                  criticalBlockers={taskView?.criticalBlockers ?? []}
                  approvalRequired={taskView?.approvalRequired ?? []}
                  groups={taskView?.groups ?? []}
                  standalone={taskView?.standalone ?? []}
                  resolvedRecent={taskView?.resolvedRecent ?? []}
                  signatureReadinessSlot={
                    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                      <p className="text-sm font-semibold text-white">Signature readiness</p>
                      <SignatureReadinessChecklist items={signaturePackage.checklist} />
                    </div>
                  }
                />
                <AutomationActivityFeed documentId={selectedId} />
                <EscalationRecommendationsPanel items={escalationItems} />
                <LegalGraphSummaryCard summary={legalGraph?.summary ?? null} />
                <LegalAssistantPanel documentId={selectedId} />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
