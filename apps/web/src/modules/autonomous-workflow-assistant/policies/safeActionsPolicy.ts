/** Actions that may be executed automatically in a safe, non-binding way (audit + notifications only). */
export const SAFE_AUTOMATION_ACTIONS = new Set([
  "record_automation_event",
  "create_pending_task",
  "draft_internal_comment",
  "emit_analytics_event",
  "generate_checklist_draft",
  "generate_follow_up_questions_draft",
]);

export function isSafeAutomationAction(actionType: string): boolean {
  return SAFE_AUTOMATION_ACTIONS.has(actionType);
}
