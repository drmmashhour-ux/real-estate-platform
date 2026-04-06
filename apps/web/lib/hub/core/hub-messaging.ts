/**
 * Lifecycle messaging — shared milestone ids; adapters map to templates and channels.
 */

import type { HubMessagingMilestoneId } from "./hub-types";

export const DEFAULT_MILESTONE_ORDER: HubMessagingMilestoneId[] = [
  "request_received",
  "confirmed",
  "pre_start",
  "in_progress",
  "completed",
  "post_completion",
];

export type HubMessagingAdapter = {
  hubKey: string;
  milestonesForReservation(reservationId: string): Promise<HubMessagingMilestoneId[]>;
};
