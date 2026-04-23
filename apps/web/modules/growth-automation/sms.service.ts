import type { PersonalizationContext } from "./automation.types";

function shortName(ctx: PersonalizationContext): string {
  return ctx.name?.trim() ? ctx.name.trim().split(/\s+/)[0] ?? "there" : "there";
}

/** SMS-sized copy — keep under ~300 chars for carrier segments */
export function renderSms(templateKey: string, ctx: PersonalizationContext): string {
  const n = shortName(ctx);
  const loc = ctx.location?.trim() ? ` ${ctx.location.trim()}` : "";

  switch (templateKey) {
    case "new_lead_sms_ping":
      return `LECIPM: Hi ${n} — got your interest (${ctx.intent}). Reply YES for a curated shortlist${loc ? ` near${loc}` : ""}.`;
    case "broker_sms_hook":
      return `LECIPM Partners: ${n}, want a 12-min demo of routed buyer intent? Reply DEMO.`;
    case "investor_sms_hook":
      return `LECIPM Investor: ${n} — pitch summary sent. Reply CALL for a diligence sync.`;
    default:
      return `LECIPM: Thanks ${n}. We’ll follow up on ${ctx.intent}.`;
  }
}
