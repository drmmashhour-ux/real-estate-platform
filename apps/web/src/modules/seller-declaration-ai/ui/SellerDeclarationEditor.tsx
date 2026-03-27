"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { sellerDeclarationSections } from "@/src/modules/seller-declaration-ai/domain/declaration.schema";
import { runDeclarationValidationDeterministic } from "@/src/modules/seller-declaration-ai/validation/declarationValidationService";
import { DeclarationSectionCard } from "@/src/modules/seller-declaration-ai/ui/DeclarationSectionCard";
import { DeclarationAIHelperPanel } from "@/src/modules/seller-declaration-ai/ui/DeclarationAIHelperPanel";
import { DeclarationValidationSummary } from "@/src/modules/seller-declaration-ai/ui/DeclarationValidationSummary";
import { DeclarationReviewSummary } from "@/src/modules/seller-declaration-ai/ui/DeclarationReviewSummary";
import { DeclarationTopBar } from "@/src/modules/seller-declaration-ai/ui/DeclarationTopBar";
import { LegalWorkflowStatusBar } from "@/src/modules/legal-workflow/ui/LegalWorkflowStatusBar";
import { DocumentVersionPanel } from "@/src/modules/legal-workflow/ui/DocumentVersionPanel";
import { AuditTimeline } from "@/src/modules/legal-workflow/ui/AuditTimeline";
import { ExportPdfButton } from "@/src/modules/legal-workflow/ui/ExportPdfButton";
import { SignatureStatusCard } from "@/src/modules/legal-workflow/ui/SignatureStatusCard";
import { LegalAssistantPanel } from "@/src/modules/ai-legal-assistant/ui/LegalAssistantPanel";
import { AutoDraftingPanel } from "@/src/modules/ai-auto-drafting/ui/AutoDraftingPanel";
import { LegalGraphSummaryCard } from "@/src/modules/legal-intelligence-graph/ui/LegalGraphSummaryCard";
import { BlockingIssuesPanel } from "@/src/modules/legal-intelligence-graph/ui/BlockingIssuesPanel";
import { MissingDependenciesList } from "@/src/modules/legal-intelligence-graph/ui/MissingDependenciesList";
import { SignatureReadinessCard } from "@/src/modules/legal-intelligence-graph/ui/SignatureReadinessCard";
import { LegalGraphTimeline } from "@/src/modules/legal-intelligence-graph/ui/LegalGraphTimeline";
import { AutonomousTaskReviewPanel } from "@/src/modules/autonomous-workflow-assistant/ui/AutonomousTaskReviewPanel";
import type { DeclarationValidationResult } from "@/src/modules/seller-declaration-ai/domain/declaration.types";

type Props = { listingId: string; initialDraftId: string; initialPayload?: Record<string, unknown> };

export function SellerDeclarationEditor({ listingId, initialDraftId, initialPayload = {} }: Props) {
  const [draftId, setDraftId] = useState(initialDraftId);
  const [values, setValues] = useState<Record<string, unknown>>(initialPayload);
  const [activeSection, setActiveSection] = useState<string>(sellerDeclarationSections[0]?.key ?? "");
  const [suggestion, setSuggestion] = useState("");
  const [missingFacts, setMissingFacts] = useState<string[]>([]);
  const [questions, setQuestions] = useState<string[]>([]);
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, string>>({});
  const [explain, setExplain] = useState<{
    text: string;
    expectedAnswer: string;
    example: string;
    sources?: Array<{ title: string; pageNumber: number | null; importance: string; excerpt: string }>;
  } | null>(null);
  const [validation, setValidation] = useState<DeclarationValidationResult | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState("draft");
  const [versions, setVersions] = useState<any[]>([]);
  const [auditItems, setAuditItems] = useState<any[]>([]);
  const [signatures, setSignatures] = useState<any[]>([]);
  const [legalGraph, setLegalGraph] = useState<any>(null);
  const [taskView, setTaskView] = useState<{
    criticalBlockers: any[];
    approvalRequired: any[];
    groups: { id: string; title: string; tasks: any[] }[];
    standalone: any[];
    resolvedRecent: any[];
  } | null>(null);

  const activeSectionObj = useMemo(() => sellerDeclarationSections.find((s) => s.key === activeSection) ?? sellerDeclarationSections[0], [activeSection]);

  const reloadWorkflowTasks = useCallback(async () => {
    const tv = await fetch(
      `/api/autonomous-workflow/tasks?documentId=${encodeURIComponent(draftId)}&grouped=1&includeResolved=1`,
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
  }, [draftId]);

  // Phase 2: evaluate + persist safe autonomous tasks (reviewable only).
  useEffect(() => {
    if (!draftId) return;
    let cancelled = false;
    (async () => {
      const ev = await fetch("/api/autonomous-workflow/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: draftId }),
      })
        .then((r) => r.json())
        .catch(() => ({ steps: [], resolutionSnapshot: undefined }));

      await fetch("/api/autonomous-workflow/run-safe-actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId: draftId,
          triggerType: "validation_completed",
          steps: ev.steps ?? [],
          resolutionSnapshot: ev.resolutionSnapshot,
        }),
      }).catch(() => undefined);

      const tv = await fetch(
        `/api/autonomous-workflow/tasks?documentId=${encodeURIComponent(draftId)}&grouped=1&includeResolved=1`,
      )
        .then((r) => r.json())
        .catch(() => null);

      if (!cancelled) {
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
    })();
    return () => {
      cancelled = true;
    };
  }, [draftId]);

  useEffect(() => {
    const next = runDeclarationValidationDeterministic(values);
    setValidation(next);
  }, [values]);

  useEffect(() => {
    const id = setTimeout(() => {
      fetch("/api/seller-declaration-ai/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload: values }),
      })
        .then((r) => r.json())
        .then((j) => {
          setValidation((prev) =>
            prev
              ? {
                  ...prev,
                  knowledgeRiskHints: j.knowledgeRiskHints ?? prev.knowledgeRiskHints ?? [],
                }
              : prev,
          );
        })
        .catch(() => undefined);
    }, 1400);
    return () => clearTimeout(id);
  }, [values]);

  const sectionCompletion = useMemo(() => {
    const readyCount = sellerDeclarationSections.filter((section) =>
      section.fields
        .filter((f) => !f.conditional || values[f.conditional.fieldKey] === f.conditional.equals)
        .every((f) => !f.required || (typeof values[f.key] === "boolean" ? true : String(values[f.key] ?? "").trim().length > 0))
    ).length;
    return Math.round((readyCount / Math.max(1, sellerDeclarationSections.length)) * 100);
  }, [values]);

  async function saveDraft() {
    const res = await fetch("/api/seller-declaration-ai/draft/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ draftId, listingId, payload: values }),
    });
    const json = await res.json();
    if (json?.draft?.id) setDraftId(json.draft.id);
    if (json?.validation) setValidation(json.validation);
  }

  async function runValidate() {
    const res = await fetch("/api/seller-declaration-ai/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload: values }),
    });
    const json = await res.json();
    setValidation(json);
  }

  async function onSuggest(sectionKey: string) {
    setActiveSection(sectionKey);
    setAiPanelOpen(true);
    const res = await fetch("/api/seller-declaration-ai/suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectionKey, currentFacts: values, listingId, draftId }),
    });
    const json = await res.json();
    setSuggestion(json.suggestedText ?? "");
    setMissingFacts(json.missingFacts ?? []);
  }

  async function onExplain(sectionKey: string) {
    setActiveSection(sectionKey);
    setAiPanelOpen(true);
    const res = await fetch("/api/seller-declaration-ai/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectionKey }),
    });
    const json = await res.json();
    setExplain(json);
  }

  async function onFollowUp(sectionKey = activeSection) {
    const detailsKey = `${sectionKey}_details`;
    const res = await fetch("/api/seller-declaration-ai/follow-up", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectionKey, currentAnswer: String(values[detailsKey] ?? ""), currentDraft: values, draftId, listingId }),
    });
    const json = await res.json();
    setQuestions(json.questions ?? []);
  }

  async function loadReview() {
    const res = await fetch(`/api/seller-declaration-ai/review/${draftId}`);
    const json = await res.json();
    setSummary(json);
  }

  function applySuggestion() {
    const detailsField = activeSectionObj?.fields.find((f) => f.inputType === "textarea")?.key;
    if (detailsField && suggestion) {
      setValues((prev) => ({ ...prev, [detailsField]: suggestion }));
      fetch("/api/seller-declaration-ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionKey: activeSection, currentFacts: values, listingId, draftId, markApplied: true }),
      }).catch(() => undefined);
    }
  }


  async function loadWorkflow() {
    const res = await fetch(`/api/legal-workflow/${draftId}`);
    const json = await res.json();
    if (json?.document?.status) setWorkflowStatus(json.document.status);
    setVersions(json?.versions ?? []);
    setAuditItems(json?.audit ?? []);
    setSignatures(json?.document?.signatures ?? []);
    const g = await fetch(`/api/legal-graph/${draftId}`).then((r) => r.json()).catch(() => null);
    setLegalGraph(g);
  }

  async function requestReview() {
    await fetch(`/api/legal-workflow/${draftId}/request-review`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ note: "Requested from editor" }) });
    await loadWorkflow();
  }

  async function exportPdf() {
    const res = await fetch(`/api/legal-workflow/${draftId}/export-pdf`, { method: "POST" });
    const json = await res.json();
    if (json?.contentBase64) {
      const a = document.createElement("a");
      a.href = `data:${json.mimeType};base64,${json.contentBase64}`;
      a.download = json.fileName || `declaration-${draftId}.pdf`;
      a.click();
    }
    await loadWorkflow();
  }

  function previewText() {
    return sellerDeclarationSections
      .map((section) => {
        const lines = section.fields.map((f) => `${f.label}: ${String(values[f.key] ?? "")}`);
        return `${section.label}\n${lines.join("\n")}`;
      })
      .join("\n\n");
  }

  useEffect(() => {
    if (draftId) loadWorkflow().catch(() => undefined);
  }, [draftId]);

  return (
    <div className="space-y-4">
      <DeclarationTopBar progressPercent={validation?.completenessPercent ?? sectionCompletion} onSave={saveDraft} onValidate={runValidate} onPreview={() => setPreviewOpen(true)} />

      <div className="lg:hidden">
        <button type="button" className="w-full rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-xs text-white" onClick={() => setAiPanelOpen((v) => !v)}>
          {aiPanelOpen ? "Hide AI panel" : "Show AI panel"}
        </button>
      </div>

      <LegalWorkflowStatusBar status={workflowStatus} onRequestReview={requestReview} />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-3">
          {sellerDeclarationSections.map((section) => {
            const sectionStatus = validation?.sectionStatuses.find((s) => s.sectionKey === section.key);
            const sectionWarnings = (validation?.warningFlags ?? []).filter((w) => w.toLowerCase().includes(section.key.split("_")[0]));
            return (
              <DeclarationSectionCard
                key={section.key}
                section={section}
                values={values}
                sectionReady={sectionStatus?.ready ?? false}
                sectionWarnings={sectionWarnings}
                onChange={(k, v) => setValues((prev) => ({ ...prev, [k]: v }))}
                onExplain={onExplain}
                onSuggest={onSuggest}
              />
            );
          })}
        </div>

        <div className={`${aiPanelOpen ? "block" : "hidden"} lg:block`}>
          <DeclarationAIHelperPanel
            suggestion={suggestion}
            missingFacts={missingFacts}
            questions={questions}
            questionAnswers={questionAnswers}
            explain={explain}
            warnings={validation?.warningFlags ?? []}
            onApply={applySuggestion}
            onGenerateFollowUp={() => onFollowUp()}
            onAnswerChange={(q, a) => setQuestionAnswers((prev) => ({ ...prev, [q]: a }))}
          />
          <AutoDraftingPanel
            documentId={draftId}
            sectionKey={activeSection}
            facts={values as Record<string, unknown>}
            onApplyText={(text) => {
              const detailsKey = `${activeSection}_details`;
              if (values[detailsKey] !== undefined) setValues((prev) => ({ ...prev, [detailsKey]: text }));
            }}
          />
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/25 p-4">
        <p className="mb-2 text-sm font-semibold text-white">Validation summary</p>
        <div className="flex items-center justify-between gap-2">
          <DeclarationValidationSummary validation={validation} onReadyForReview={loadReview} />
          <ExportPdfButton onExport={exportPdf} />
        </div>
      </div>

      <div className="rounded-xl border border-white/10 bg-black/25 p-4">
        <p className="mb-2 text-sm font-semibold text-white">Review summary</p>
        <DeclarationReviewSummary summary={summary} />
        <div className="mt-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Autonomous workflow tasks (safe)</p>
          <AutonomousTaskReviewPanel
            documentId={draftId}
            onTasksChanged={reloadWorkflowTasks}
            criticalBlockers={taskView?.criticalBlockers ?? []}
            approvalRequired={taskView?.approvalRequired ?? []}
            groups={taskView?.groups ?? []}
            standalone={taskView?.standalone ?? []}
            resolvedRecent={taskView?.resolvedRecent ?? []}
            signatureReadinessSlot={
              <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                <p className="text-sm font-semibold text-white">Signature readiness</p>
                <SignatureReadinessCard
                  ready={legalGraph?.summary?.signatureReadiness?.ready ?? false}
                  reasons={legalGraph?.summary?.signatureReadiness?.reasons ?? []}
                />
              </div>
            }
          />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <DocumentVersionPanel versions={versions} />
        <AuditTimeline items={auditItems} />
        <SignatureStatusCard signatures={signatures} />
      </div>
      <div className="grid gap-3 lg:grid-cols-1">
        <LegalGraphSummaryCard summary={legalGraph?.summary ?? null} />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <BlockingIssuesPanel issues={legalGraph?.summary?.blockingIssues ?? []} />
        <MissingDependenciesList items={legalGraph?.summary?.missingDependencies ?? []} />
      </div>
      <LegalGraphTimeline actions={legalGraph?.summary?.nextActions ?? []} />
      <LegalAssistantPanel documentId={draftId} sectionKey={activeSection} />

      {previewOpen ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4">
          <div className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-xl border border-white/10 bg-[#111214] p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Declaration preview</p>
              <button type="button" className="text-xs text-slate-400 hover:text-white" onClick={() => setPreviewOpen(false)}>Close</button>
            </div>
            <pre className="whitespace-pre-wrap text-xs text-slate-200">{previewText()}</pre>
          </div>
        </div>
      ) : null}
    </div>
  );
}
