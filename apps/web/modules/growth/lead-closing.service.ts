import type { LeadClosingScript } from "./lead-closing.types";

function escapeCity(city: string): string {
  const t = city.trim();
  return t.length > 0 ? t : "your area";
}

/**
 * Copy-paste scripts for human send only — no automation; outcomes not guaranteed.
 */
export function getLeadClosingScripts(city: string): LeadClosingScript[] {
  const c = escapeCity(city);
  return [
    {
      stage: "qualification",
      message:
        "Hey — just to make sure I send you the right options, are you actively looking to buy soon or just exploring?",
    },
    {
      stage: "engagement",
      message: `Got it — I actually have a few properties in ${c} that could match what you're looking for.`,
    },
    {
      stage: "connection",
      message:
        "I can connect you with a local agent who can show you these and move quickly if you like one.",
    },
    {
      stage: "conversion",
      message: "Do you want me to set you up with them so you can start visiting properties?",
    },
  ];
}
