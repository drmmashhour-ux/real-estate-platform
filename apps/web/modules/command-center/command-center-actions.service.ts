import type { PlatformRole } from "@prisma/client";

import type { SignalAction } from "./signal.types";
import { isExecutiveCommandCenter } from "./command-center.types";

const uid = (): string => `act_${Math.random().toString(36).slice(2, 10)}`;

/** Navigation targets shared by signal builder and quick actions. */
export function dealsHref(): string {
  return "/dashboard/lecipm/deals";
}

export function leadsHref(): string {
  return "/dashboard/lecipm/leads";
}

export function listingAssistantHref(): string {
  return "/dashboard/lecipm/listings/assistant";
}

export function autonomyHref(role: PlatformRole): string {
  return isExecutiveCommandCenter(role) ? "/dashboard/admin/autonomy-command-center" : leadsHref();
}

export function disputesHref(role: PlatformRole): string {
  return isExecutiveCommandCenter(role) ? "/dashboard/admin/disputes" : "/dashboard/disputes";
}

export function trustHref(role: PlatformRole): string {
  return isExecutiveCommandCenter(role) ? "/dashboard/admin/trust-score" : "/dashboard/broker/trust";
}

export function calendarHref(): string {
  return "/dashboard/broker/calendar";
}

export function aiCeoAdjustmentsHref(): string {
  return "/dashboard/admin/ai-ceo/system-adjustments";
}

export function disputePredictionHref(): string {
  return "/dashboard/admin/dispute-prediction";
}

export function growthHref(): string {
  return "/dashboard/growth";
}

export function territoryWarRoomHref(): string {
  return "/dashboard/admin/territory-war-room";
}

export function navigate(label: string, href: string, id?: string): SignalAction {
  return { id: id ?? uid(), label, kind: "navigate", href };
}

export function assistantFollowUp(role: PlatformRole): SignalAction {
  return navigate(
    "Draft follow-up (assistant)",
    listingAssistantHref(),
    "assistant-follow-up",
  );
}

export function openDeal(dealId: string): SignalAction {
  return navigate("Open deal", `/broker/residential/deals/${dealId}`, `deal-${dealId}`);
}

/** AI CEO adjustments require documented approval — deep link only; POST needs reason server-side. */
export function reviewCeoAdjustment(adjustmentId: string): SignalAction {
  return {
    id: `ceo-review-${adjustmentId}`,
    label: "Review in AI CEO queue",
    kind: "navigate",
    href: `${aiCeoAdjustmentsHref()}?focus=${adjustmentId}`,
    requiresApproval: true,
    postHref: `/api/admin/ai-ceo/system-adjustments/${adjustmentId}/approve`,
  };
}
