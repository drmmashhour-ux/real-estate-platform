/**
 * Broker closing / objection scripts — Québec LECIPM tone. Edit copy here only.
 */

export const objection_not_sure =
  "Totally fair — LECIPM is newer in your market. Think of it as verified listing exposure plus a broker workspace: you only pay when you unlock a qualified CRM lead you want to pursue. Want a 10-min walkthrough of one masked example?";

/** Alias — “not sure” objection */
export const not_sure = objection_not_sure;

export const objection_price =
  "On price: lead unlock is pay-per-contact (Stripe), not a subscription — you decide which leads to buy. I can share typical ranges once you’ve seen the pipeline. Does a quick numbers call work Thursday?";

/** Alias — price objection */
export const price = objection_price;

export const objection_info =
  "Happy to send more: we connect buyers/sellers with pros on-platform; leads are intake messages (masked until unlock). I can email a one-pager — or we do 10 minutes live and you’ll see the actual broker view. Preference?";

export const follow_up =
  "Circling back — did you get a chance to look at LECIPM for Québec leads? I can paste a masked sample lead so you see real intent (location + message snippet). Still open to a short call?";

export const final_close =
  "If you’re ready to try it: next step is broker onboarding in the dashboard, then you can unlock leads as they fit your book. I’ll stay on the line for your first unlock — want to start this week?";

/** Short line to paste before sending a masked lead preview */
export const show_lead_invite =
  "Here’s a masked sample of what a buyer lead looks like on LECIPM (no names — real intent from our intake):";

/** Alias — show lead / preview invite line */
export const show_lead = show_lead_invite;

export type BrokerProspectStatusForClose =
  | "new"
  | "contacted"
  | "replied"
  | "demo_scheduled"
  | "converted"
  | "lost";

/** Conversion nudge copy aligned to pipeline stage */
export function getCloseSmartRecommendation(status: string): { title: string; action: string } {
  switch (status) {
    case "new":
      return {
        title: "Start here",
        action: "Use the acquisition “first message”, then move status to Contacted.",
      };
    case "contacted":
      return {
        title: "Follow up",
        action: "Send Follow-up script or Close follow_up — log replies and move to Replied.",
      };
    case "replied":
      return {
        title: "Show value",
        action: "Use Show lead preview + objection_info / price; book a demo when they’re warm.",
      };
    case "demo_scheduled":
      return {
        title: "Close",
        action: "Use Final close script; sync conversions after their first paid unlock.",
      };
    case "converted":
      return {
        title: "Onboarded",
        action: "Keep notes for referrals and next upsell moments.",
      };
    case "lost":
      return {
        title: "Nurture later",
        action: "Light check-in in 30–60 days with a new market note.",
      };
    default:
      return { title: "Next step", action: "Update status to match the last real touch." };
  }
}
