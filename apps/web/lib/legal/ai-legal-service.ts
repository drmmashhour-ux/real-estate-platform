import { runAiTask } from "@/modules/ai/core/ai-client";
import type { AiHub } from "@/modules/ai/core/types";
import { AI_LEGAL_DISCLAIMER } from "@/lib/legal/ai-legal-disclaimer";

function appendDisclaimer(text: string): string {
  const t = text.trim();
  if (t.includes("not legal advice")) return `${t}\n\n${AI_LEGAL_DISCLAIMER}`;
  return `${t}\n\n${AI_LEGAL_DISCLAIMER}`;
}

export async function aiExplainLicenseSection(params: {
  userId: string;
  role: string;
  sectionTitle: string;
  sectionBody: string;
  locale?: string;
}) {
  const r = await runAiTask({
    hub: "seller",
    feature: "content_license_explain",
    intent: "explain",
    userId: params.userId,
    role: params.role,
    legalContext: true,
    context: {
      sectionTitle: params.sectionTitle,
      sectionBody: params.sectionBody.slice(0, 8000),
      locale: params.locale ?? "en",
    },
  });
  return { ...r, text: appendDisclaimer(r.text) };
}

export async function aiExplainLegalActionRisk(params: {
  userId: string;
  role: string;
  hub: AiHub;
  actionType: string;
  entity: Record<string, unknown>;
  heuristic: { riskScore: number; reason: string };
}) {
  const r = await runAiTask({
    hub: params.hub,
    feature: "legal_action_risk",
    intent: "risk",
    userId: params.userId,
    role: params.role,
    legalContext: true,
    context: {
      actionType: params.actionType,
      entity: params.entity,
      automatedAssessment: params.heuristic,
    },
  });
  return { ...r, text: appendDisclaimer(r.text) };
}

export async function aiLegalReadinessNarrative(params: {
  userId: string;
  role: string;
  listing: Record<string, unknown>;
  heuristic: { score: number; flags: string[]; recommendedFixes: string[] };
}) {
  const r = await runAiTask({
    hub: "seller",
    feature: "legal_readiness_score",
    intent: "analyze",
    userId: params.userId,
    role: params.role,
    legalContext: true,
    context: {
      listingSnapshot: params.listing,
      heuristic: params.heuristic,
    },
  });
  return { ...r, text: appendDisclaimer(r.text) };
}

export async function aiExplainContractPlain(params: {
  userId: string;
  role: string;
  contractKind: string;
  plainTextExcerpt: string;
}) {
  const r = await runAiTask({
    hub: "seller",
    feature: "contract_plain_explain",
    intent: "explain",
    userId: params.userId,
    role: params.role,
    legalContext: true,
    context: {
      contractKind: params.contractKind,
      textExcerpt: params.plainTextExcerpt.slice(0, 12000),
    },
  });
  return { ...r, text: appendDisclaimer(r.text) };
}

export async function aiLegalRiskReportForAdmin(params: { userId: string; role: string; stats: Record<string, unknown> }) {
  const r = await runAiTask({
    hub: "admin",
    feature: "legal_risk_report",
    intent: "summary",
    userId: params.userId,
    role: params.role,
    legalContext: true,
    context: params.stats,
  });
  return { ...r, text: appendDisclaimer(r.text) };
}
