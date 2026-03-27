/**
 * Prefilled follow-up copy for CRM (broker edits before send).
 */

export const FOLLOWUP_TEMPLATES = {
  first: `Hi, this is Mohamed from LECIPM following up on your request. I'd be happy to guide you with no obligation.`,
  noReply: `Just checking in — I can still help you with your property or mortgage request whenever you're ready.`,
  preClosing: `I'd be happy to help you move forward and make sure you get the best result. Let's finalize the next step together.`,
  afterMeeting: `Thank you for your time. Based on our discussion, I'm confident I can help you move ahead efficiently. Let's confirm the next step.`,
} as const;

export type FollowupTemplateKey = keyof typeof FOLLOWUP_TEMPLATES;

export function getFollowupTemplate(key: FollowupTemplateKey): string {
  return FOLLOWUP_TEMPLATES[key];
}
