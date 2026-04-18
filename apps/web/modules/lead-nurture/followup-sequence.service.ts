/**
 * Follow-up sequence templates — drafts only; sending stays in existing messaging/CRM flows.
 */
export function buildFollowUpDraft(opts: { leadName: string; city: string; channel: "email" | "sms_hint" }) {
  const greeting = `Hi ${opts.leadName},`;
  if (opts.channel === "email") {
    return {
      subject: `Quick follow-up — ${opts.city}`,
      body: `${greeting}\n\nFollowing up on your inquiry on LECIPM. What’s the best time for a 10-minute call this week?\n\n—`,
    };
  }
  return {
    hint: `${greeting} checking in on your ${opts.city} search — reply with a good time to connect.`,
  };
}
