import { buildOutreachScript } from "./outreach-script.service";

/** Suggested follow-up after no reply — still manual send. */
export function buildFollowUpDraft(tokens: { area: string; founderFirstName?: string }) {
  const base = buildOutreachScript("email_short", tokens);
  return {
    title: "Follow-up (7–10 days)",
    body: `${base.body}\n\n---\nFollow-up: checking if timing works — one message only unless you reply.`,
    reviewRequired: true as const,
    law25Note: base.law25Note,
  };
}
