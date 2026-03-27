import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { LegalAssistantIntent } from "@/src/modules/ai-legal-assistant/domain/legalAssistant.enums";
import type { LegalAssistantResponse } from "@/src/modules/ai-legal-assistant/domain/legalAssistant.types";
import { buildLegalAssistantContext } from "@/src/modules/ai-legal-assistant/application/buildLegalAssistantContext";
import { detectLegalIntent } from "@/src/modules/ai-legal-assistant/application/detectLegalIntent";
import { buildLegalAssistantResponse } from "@/src/modules/ai-legal-assistant/infrastructure/legalAssistantResponseBuilder";
import { getSectionExplanation } from "@/src/modules/ai-legal-assistant/tools/getSectionExplanation";
import { getVersionComparison } from "@/src/modules/ai-legal-assistant/tools/getVersionComparison";
import { createAuditLog } from "@/src/modules/legal-workflow/infrastructure/legalWorkflowRepository";

export async function runLegalAssistant(args: { documentId: string; userId: string; message: string; sectionKey?: string; versionA?: number; versionB?: number }) {
  const intent = detectLegalIntent(args.message);
  const context = await buildLegalAssistantContext(args.documentId, args.userId, args.message);

  let response: LegalAssistantResponse = buildLegalAssistantResponse(intent, context);

  if (intent === LegalAssistantIntent.EXPLAIN_CLAUSE && args.sectionKey) {
    const exp = await getSectionExplanation(args.sectionKey);
    response = buildLegalAssistantResponse(intent, context, {
      summary: exp.text,
      keyPoints: [exp.expectedAnswer, exp.example],
      sourceSections: [args.sectionKey],
    });
  }

  if (intent === LegalAssistantIntent.COMPARE_VERSIONS && args.versionA && args.versionB) {
    const cmp = await getVersionComparison(args.documentId, args.userId, args.versionA, args.versionB);
    response = buildLegalAssistantResponse(intent, context, {
      summary: `Compared versions ${args.versionA} and ${args.versionB}.`,
      keyPoints: cmp.changedKeys.map((k) => `Changed: ${k}`),
      sourceSections: cmp.changedKeys.slice(0, 8),
    });
    captureServerEvent(args.userId, "legal_assistant_version_compared", { documentId: args.documentId, versionA: args.versionA, versionB: args.versionB });
  }

  captureServerEvent(args.userId, "legal_assistant_question_asked", { documentId: args.documentId, intent, summary: response.summary });
  await createAuditLog({ documentId: args.documentId, actorUserId: args.userId, actionType: "legal_assistant_question_asked", metadata: { intent, summary: response.summary } });
  return response;
}
