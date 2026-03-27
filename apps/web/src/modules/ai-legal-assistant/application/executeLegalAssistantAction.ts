import { captureServerEvent } from "@/lib/analytics/posthog-server";
import { createAuditLog } from "@/src/modules/legal-workflow/infrastructure/legalWorkflowRepository";
import { draftInternalComment } from "@/src/modules/ai-legal-assistant/tools/draftInternalComment";
import { generateFollowupQuestions } from "@/src/modules/ai-legal-assistant/tools/generateFollowupQuestions";

export async function executeLegalAssistantAction(args: {
  action: "generate_followup_questions" | "draft_internal_comment";
  documentId: string;
  sectionKey?: string;
  userId: string;
}) {
  if (args.action === "generate_followup_questions") {
    const out = await generateFollowupQuestions(args.documentId, args.userId, args.sectionKey ?? "known_defects");
    captureServerEvent(args.userId, "legal_assistant_followup_created", { documentId: args.documentId, sectionKey: args.sectionKey ?? null });
    await createAuditLog({ documentId: args.documentId, actorUserId: args.userId, actionType: "legal_assistant_action_generated", metadata: { action: args.action, sectionKey: args.sectionKey ?? null, outputCount: out.questions.length } });
    return { type: args.action, output: out };
  }
  const comment = await draftInternalComment(args.documentId, args.userId, args.sectionKey);
  captureServerEvent(args.userId, "legal_assistant_comment_drafted", { documentId: args.documentId, sectionKey: args.sectionKey ?? null });
  await createAuditLog({ documentId: args.documentId, actorUserId: args.userId, actionType: "legal_assistant_action_generated", metadata: { action: args.action, sectionKey: args.sectionKey ?? null } });
  return { type: args.action, output: comment };
}
