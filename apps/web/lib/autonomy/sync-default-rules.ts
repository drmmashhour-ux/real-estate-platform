import { PlatformAutonomyEventType } from "@prisma/client";
import { prisma } from "@/lib/db";

const DEFAULT_RULES: {
  name: string;
  eventType: PlatformAutonomyEventType;
  actionKind: string;
  actionPayload?: Record<string, unknown>;
  conditionJson?: Record<string, unknown>;
  priority: number;
}[] = [
  {
    name: "default_log_listing_created",
    eventType: "LISTING_CREATED",
    actionKind: "log_only",
    priority: 0,
  },
  {
    name: "default_queue_content_bulk_csv_listing",
    eventType: "LISTING_CREATED",
    actionKind: "queue_listing_content",
    conditionJson: { payloadHas: ["listingId"], payloadEquals: { source: "admin_bulk_csv" } },
    priority: 5,
  },
  {
    name: "default_log_listing_updated",
    eventType: "LISTING_UPDATED",
    actionKind: "log_only",
    priority: 0,
  },
  {
    name: "default_log_booking_created",
    eventType: "BOOKING_CREATED",
    actionKind: "log_only",
    priority: 0,
  },
  {
    name: "default_notify_booking_abandoned",
    eventType: "BOOKING_ABANDONED",
    actionKind: "notify_admin",
    actionPayload: {
      titleTemplate: "Stale booking checkout",
      bodyTemplate: "Guest has not completed payment — booking {{entityId}}",
    },
    priority: 10,
  },
  {
    name: "default_log_user_activity_sample",
    eventType: "USER_ACTIVITY",
    actionKind: "log_only",
    priority: 0,
  },
];

/** Idempotent seed for new deployments. */
export async function syncDefaultPlatformAutomationRules(): Promise<void> {
  for (const r of DEFAULT_RULES) {
    await prisma.platformAutomationRule.upsert({
      where: { name: r.name },
      create: {
        name: r.name,
        enabled: true,
        eventType: r.eventType,
        conditionJson: r.conditionJson as object | undefined,
        actionKind: r.actionKind,
        actionPayload: r.actionPayload as object | undefined,
        priority: r.priority,
      },
      update: {
        eventType: r.eventType,
        conditionJson: r.conditionJson === undefined ? undefined : (r.conditionJson as object),
        actionKind: r.actionKind,
        actionPayload: r.actionPayload === undefined ? undefined : (r.actionPayload as object),
        priority: r.priority,
      },
    });
  }
}
