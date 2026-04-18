import type { BrokerConversationStep } from "./broker-conversation.types";

function cityLabel(city: string): string {
  const t = city.trim();
  return t.length > 0 ? t : "your area";
}

/** Internal broker nudges — human-sent only. */
export function buildBrokerConversationFlow(city: string): BrokerConversationStep[] {
  const c = cityLabel(city);
  return [
    {
      stage: "handoff",
      message: `I'm sending you a lead actively looking in ${c}.`,
    },
    {
      stage: "activation",
      message: "Try to contact them within 5–10 minutes.",
    },
    {
      stage: "urgency",
      message: "This lead is currently exploring options — timing matters.",
    },
    {
      stage: "closing",
      message: "If they like a property, encourage moving forward quickly.",
    },
  ];
}
