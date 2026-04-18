import type { GhostFollowUp } from "./anti-ghosting.types";

function cityLabel(city: string): string {
  const t = city.trim();
  return t.length > 0 ? t : "your area";
}

/** Recovery pings — paste manually; no automated sends. */
export function buildGhostRecoveryMessages(city: string): GhostFollowUp[] {
  const c = cityLabel(city);
  return [
    {
      timing: "1_hour",
      message: `Hey — just checking in 😊\nAre you still looking in ${c}?`,
    },
    {
      timing: "same_day",
      message: "I don't want you to miss good opportunities — things move fast.",
    },
    {
      timing: "next_day",
      message: "I had a couple of listings that might match what you're looking for.",
    },
  ];
}
