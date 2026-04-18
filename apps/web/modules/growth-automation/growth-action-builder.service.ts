/**
 * Builds human-review actions — never sends email/SMS from this layer.
 */
export function buildReviewableAction(opts: { type: "email_draft" | "task"; title: string; body: string }) {
  return {
    requiresApproval: true,
    channel: opts.type,
    title: opts.title,
    body: opts.body,
  };
}
