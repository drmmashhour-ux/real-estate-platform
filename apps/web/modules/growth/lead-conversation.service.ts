import type { LeadConversationStep } from "./lead-conversation.types";

function cityLabel(city: string): string {
  const t = city.trim();
  return t.length > 0 ? t : "your area";
}

/**
 * Deterministic copy for human send only — does not touch lead records or send messages.
 */
export function buildLeadConversationFlow(city: string): LeadConversationStep[] {
  const c = cityLabel(city);
  return [
    {
      stage: "instant",
      intent: "Open fast + confirm intent (buy vs explore)",
      message:
        `Hey! Just saw your request about buying in ${c} 😊\n` +
        `Are you looking to buy soon or just exploring?`,
    },
    {
      stage: "qualification",
      intent: "Property type / use case",
      message: "What type of property are you looking for (condo, house, investment)?",
    },
    {
      stage: "engagement",
      intent: "Signal market fit without overpromising",
      message: "There are some strong options in that range right now.",
    },
    {
      stage: "connection",
      intent: "Bridge to a local agent",
      message: "I can connect you with a local agent who can show you these quickly.",
    },
    {
      stage: "conversion",
      intent: "Ask for the next step (intro / visits)",
      message: "Do you want me to set that up for you?",
    },
  ];
}
