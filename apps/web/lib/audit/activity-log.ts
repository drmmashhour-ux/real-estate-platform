/**
 * Activity log – track listing creation, contract signing, booking, payment (Quebec/OACIQ audit).
 */

import { prisma } from "@/lib/db";

export type ActivityAction =
  | "listing_created"
  | "listing_updated"
  | "listing_published"
  | "contract_signed"
  | "booking_created"
  | "booking_confirmed"
  | "payment_completed"
  | "broker_application_submitted"
  | "broker_approved"
  | "disclosure_signed"
  | "report_submitted";

export async function logActivity(params: {
  userId?: string | null;
  action: ActivityAction | string;
  entityType?: string | null;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  await prisma.activityLog.create({
    data: {
      userId: params.userId ?? undefined,
      action: params.action,
      entityType: params.entityType ?? undefined,
      entityId: params.entityId ?? undefined,
      metadata: (params.metadata as object) ?? undefined,
    },
  });
}
