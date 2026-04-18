import type { BrokerPressureScript } from "./broker-closing-advanced.types";

/**
 * Operator → broker nudges (manual send). `city` reserved for future personalization.
 */
export function getBrokerClosingPressureScripts(_city: string): BrokerPressureScript[] {
  void _city;
  return [
    {
      type: "activation",
      message: `I'm sending you a lead today — try to contact them within 5–10 minutes.
That's where most deals are won.`,
    },
    {
      type: "urgency",
      message: `This lead is actively looking right now.
The faster you respond, the higher your chances.`,
    },
    {
      type: "performance",
      message: `The brokers who close the most are the ones who follow up immediately.
Speed really makes the difference.`,
    },
    {
      type: "followup",
      message: `Did you manage to reach the lead?
Let me know if you need another opportunity.`,
    },
  ];
}
