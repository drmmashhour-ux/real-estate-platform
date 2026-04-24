import { logComplianceTagged } from "@/lib/server/launch-logger";

const NS = "[contract-brain][legal-notice]";

type AiDraftAuditEvent =
  | "ai_draft_generate_started"
  | "ai_draft_generate_completed"
  | "ai_draft_review_started"
  | "ai_draft_review_completed"
  | "ai_draft_blocking_finding_created"
  | "ai_draft_rewrite_requested"
  | "ai_draft_rewrite_applied"
  | "ai_draft_rewrite_rejected";

export function logAiDraftAudit(event: AiDraftAuditEvent, payload: Record<string, unknown>): void {
  logComplianceTagged.info(`${NS} [ai-drafting] ${event}`, payload);
}
