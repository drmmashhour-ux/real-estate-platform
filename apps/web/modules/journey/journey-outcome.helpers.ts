import type { HubKey, JourneyActorType } from "./hub-journey.types";

export function resolveJourneyActorType(
  hub: HubKey,
  userId: string | null | undefined,
): JourneyActorType {
  if (!userId) return "guest";
  if (hub === "admin") return "admin";
  return "user";
}
