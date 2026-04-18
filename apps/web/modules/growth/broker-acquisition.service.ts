import type { BrokerScript } from "./broker-acquisition.types";

const CITY_PLACEHOLDER = "[CITY]";

/**
 * Draft outreach scripts for human copy/paste only. No automated sending.
 */
export function getBrokerAcquisitionScripts(): BrokerScript[] {
  const dmBody = `Hey — quick question. Are you currently open to receiving qualified buyer leads in ${CITY_PLACEHOLDER}?

I'm working on a platform that connects serious buyers with agents. Some brokers are already closing deals from it.

No upfront cost — you only pay per opportunity.

Would you be open to testing a few leads?`;

  const followUp = `Just wanted to follow up — we're sending out a few high-intent leads this week. Let me know if you want me to reserve some for you.`;

  const callBody = `Hi, I'll be quick — I'm working with a platform that sends qualified buyer leads directly to brokers in ${CITY_PLACEHOLDER}.

We're currently onboarding a few agents and some are already closing deals.

There's no upfront cost — you only pay per opportunity.

Would you be open to trying a few leads this week?`;

  return [
    {
      id: "instagram-dm",
      channel: "instagram",
      title: "Instagram / LinkedIn DM",
      message: dmBody,
    },
    {
      id: "linkedin-dm",
      channel: "linkedin",
      title: "Instagram / LinkedIn DM",
      message: dmBody,
    },
    {
      id: "facebook-dm",
      channel: "facebook",
      title: "Instagram / LinkedIn DM",
      message: dmBody,
    },
    {
      id: "dm-follow-up",
      channel: "instagram",
      title: "Follow-up (DM)",
      message: followUp,
    },
    {
      id: "direct-call",
      channel: "direct_call",
      title: "Call script",
      message: callBody,
    },
  ];
}
