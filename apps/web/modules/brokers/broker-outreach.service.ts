/**
 * Outreach copy for broker acquisition V1 — short, value-first.
 */

import type { BrokerMessageScriptKind } from "@/modules/brokers/broker-pipeline.types";

export type BrokerOutreachScripts = {
  firstMessage: string;
  followUp: string;
  demoPitch: string;
  closeMessage: string;
};

export type BrokerOutreachScriptMeta = {
  id: BrokerMessageScriptKind;
  label: string;
  body: string;
};

export function getBrokerOutreachScripts(namePlaceholder = "[Name]"): BrokerOutreachScripts {
  return {
    firstMessage: `Hi ${namePlaceholder} — we built a system that sends qualified buyers and renters to brokers in your area. No subscription to start; you pay only when you unlock a lead. Want to see a few examples?`,

    followUp: `Quick follow-up on LECIPM — did my note land? I can share how brokers see masked leads until unlock (Stripe). Does a 10-minute call this week work?`,

    demoPitch: `I’ll walk you through the broker workspace: lead inbox, unlock billing, and BNHub if you list short stays. I can send times — Tuesday or Wednesday?`,

    closeMessage: `If you’re ready, create your broker account and we’ll route your first qualified lead when it matches your market. I’m here if anything blocks checkout.`,
  };
}

export function getBrokerOutreachScriptList(namePlaceholder = "[Name]"): BrokerOutreachScriptMeta[] {
  const s = getBrokerOutreachScripts(namePlaceholder);
  return [
    { id: "first_message", label: "First message", body: s.firstMessage },
    { id: "follow_up", label: "Follow-up", body: s.followUp },
    { id: "demo_pitch", label: "Demo pitch", body: s.demoPitch },
    { id: "close", label: "Close", body: s.closeMessage },
  ];
}
