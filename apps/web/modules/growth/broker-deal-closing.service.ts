import type { BrokerDealScript } from "./broker-deal-closing.types";

function escapeCity(city: string): string {
  const t = city.trim();
  return t.length > 0 ? t : "your area";
}

/**
 * Internal broker coordination copy — human-sent only; ethical nudges, no guarantees.
 */
export function getBrokerDealClosingScripts(city: string): BrokerDealScript[] {
  const c = escapeCity(city);
  return [
    {
      type: "handoff",
      message: `I'm sending you a lead actively looking in ${c}. They're responsive — try reaching out quickly.`,
    },
    {
      type: "urgency",
      message: "This lead is currently exploring options, timing is important here.",
    },
    {
      type: "followup",
      message: "Did you manage to speak with them? Let me know if you need another lead.",
    },
    {
      type: "closing",
      message:
        "If they like a property, encourage moving forward quickly — serious buyers act fast.",
    },
  ];
}
