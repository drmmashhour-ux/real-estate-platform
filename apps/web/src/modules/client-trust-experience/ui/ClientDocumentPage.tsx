"use client";

import { useEffect, useState } from "react";
import { AskQuestionPanel } from "@/src/modules/client-documents/ui/AskQuestionPanel";
import { DocumentHeader } from "@/src/modules/client-documents/ui/DocumentHeader";
import { LegalGraphSummaryCard } from "@/src/modules/legal-intelligence-graph/ui/LegalGraphSummaryCard";
import { LegalAssistantPanel } from "@/src/modules/ai-legal-assistant/ui/LegalAssistantPanel";
import { TrustBadgeVariant } from "@/src/modules/client-trust-experience/domain/clientExperience.enums";
import type { ClientSectionExplanation, ClientTrustExperienceBundle, TransparencyEvent } from "@/src/modules/client-trust-experience/domain/clientExperience.types";
import { ClientSummaryCard } from "@/src/modules/client-trust-experience/ui/ClientSummaryCard";
import { ClientAIChat } from "@/src/modules/client-trust-experience/ui/ClientAIChat";
import { ExplainDrawer } from "@/src/modules/client-trust-experience/ui/ExplainDrawer";
import { RiskHighlightList } from "@/src/modules/client-trust-experience/ui/RiskHighlight";
import { SectionCard } from "@/src/modules/client-trust-experience/ui/SectionCard";
import { SignaturePanel } from "@/src/modules/client-trust-experience/ui/SignaturePanel";
import { TransparencyPanel } from "@/src/modules/client-trust-experience/ui/TransparencyPanel";
import { TrustBadge } from "@/src/modules/client-trust-experience/ui/TrustBadge";

type ExperienceResponse = ClientTrustExperienceBundle & {
  transparency: TransparencyEvent[];
  validation: { completenessPercent: number; contradictionCount: number; warningCount: number };
  document: { id: string; listingId: string; status: string; updatedAt: string | Date };
};

function parseTrustBadge(v: string): TrustBadgeVariant {
  if (v === TrustBadgeVariant.AttentionNeeded) return TrustBadgeVariant.AttentionNeeded;
  if (v === TrustBadgeVariant.NotReady) return TrustBadgeVariant.NotReady;
  return TrustBadgeVariant.Verified;
}

export function ClientDocumentPage({ documentId }: { documentId: string }) {
  const [experience, setExperience] = useState<ExperienceResponse | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [legalGraph, setLegalGraph] = useState<any>(null);
  const [mobileActionsOpen, setMobileActionsOpen] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [explainLoadingKey, setExplainLoadingKey] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<ClientSectionExplanation | null>(null);

  async function load() {
    const [expRes, c, g] = await Promise.all([
      fetch(`/api/client-trust/${documentId}/experience`).then((r) => r.json()),
      fetch(`/api/legal-workflow/${documentId}/comments`).then((r) => r.json()),
      fetch(`/api/legal-graph/${documentId}`).then((r) => r.json()).catch(() => null),
    ]);
    setExperience(expRes as ExperienceResponse);
    setComments(c.comments ?? []);
    setLegalGraph(g);
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, [documentId]);

  async function explain(sectionKey: string) {
    setDrawerOpen(true);
    setExplanation(null);
    setExplainLoadingKey(sectionKey);
    try {
      const out = await fetch(`/api/client-trust/${documentId}/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionKey }),
      }).then((r) => r.json());
      setExplanation(out as ClientSectionExplanation);
    } finally {
      setExplainLoadingKey(null);
    }
  }

  async function askQuestion(text: string, sectionKey?: string) {
    await fetch(`/api/legal-workflow/${documentId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, sectionKey }),
    });
    await load();
  }

  async function sign(name: string, email: string) {
    await fetch(`/api/legal-workflow/${documentId}/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signerName: name, signerEmail: email }),
    });
    await load();
  }

  const trustBadge = experience ? parseTrustBadge(String(experience.trustState.trustBadge)) : TrustBadgeVariant.NotReady;
  const validationLike = experience?.validation ?? { completenessPercent: 0, contradictionCount: 0, warningCount: 0 };

  const sidebar = (
    <div className="space-y-3">
      <ExplainDrawer open={drawerOpen} explanation={explanation} onClose={() => setDrawerOpen(false)} />
      <ClientAIChat documentId={documentId} />
      <AskQuestionPanel questions={comments} onAsk={askQuestion} />
      <SignaturePanel trustState={experience?.trustState ?? null} onSign={sign} />
      <LegalAssistantPanel documentId={documentId} />
    </div>
  );

  return (
    <div className="space-y-4 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DocumentHeader
          title="Seller Declaration"
          property={experience?.document.listingId ?? "Property"}
          status={experience?.document.status ?? "draft"}
          completionPercent={validationLike.completenessPercent}
          contradictionCount={validationLike.contradictionCount}
          warningCount={validationLike.warningCount}
        />
        <TrustBadge variant={trustBadge} />
      </div>

      <ClientSummaryCard summary={experience?.summary ?? null} />

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-3">
          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-sm font-semibold text-white">Sections</p>
            <p className="mt-1 text-xs text-slate-400">Each section shows what was entered. Use “Explain this” for plain-language help.</p>
            <div className="mt-3 space-y-2">
              {(experience?.sections ?? []).map((s) => (
                <SectionCard
                  key={s.sectionKey}
                  title={s.title}
                  valuePreview={s.valuePreview}
                  hasRisk={s.hasRisk}
                  riskNote={s.riskNote}
                  loading={explainLoadingKey === s.sectionKey}
                  onExplain={() => void explain(s.sectionKey)}
                />
              ))}
            </div>
          </div>
          <RiskHighlightList items={experience?.risks ?? []} />
          <LegalGraphSummaryCard summary={legalGraph?.summary ?? null} />
          <TransparencyPanel events={experience?.transparency ?? []} />
        </div>
        <div className="hidden lg:block">{sidebar}</div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-white/10 bg-[#0f1012]/95 p-3 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setMobileActionsOpen((v) => !v)}
          className="w-full rounded-lg border border-white/20 px-3 py-2 text-xs text-white"
        >
          {mobileActionsOpen ? "Hide actions" : "Show actions"}
        </button>
        {mobileActionsOpen ? <div className="mt-3 space-y-3">{sidebar}</div> : null}
      </div>
    </div>
  );
}
