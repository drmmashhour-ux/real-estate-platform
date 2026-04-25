import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireBrokerCrmApiUser } from "@/lib/broker-crm/api-auth";
import { BROKER_ACTIVITY_TYPES, recordBrokerActivity, type BrokerActivityEventType } from "@/modules/growth/broker-activity.service";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  eventType: z.enum([
    BROKER_ACTIVITY_TYPES.leadViewed,
    BROKER_ACTIVITY_TYPES.aiSuggestionUsed,
    BROKER_ACTIVITY_TYPES.contactAttempt,
  ]),
  refId: z.string().min(1).max(64).optional().nullable(),
});

/**
 * Idempotent enough for product use: one row per event (we do not auto-dedupe).
 */
export async function POST(req: NextRequest) {
  const auth = await requireBrokerCrmApiUser();
  if (!auth.user) {
    return NextResponse.json({ error: auth.error }, { status: auth.status! });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().formErrors.join("; ") }, { status: 400 });
  }
  const { eventType, refId } = parsed.data;
  const row = await recordBrokerActivity(
    auth.user.id,
    eventType as BrokerActivityEventType,
    refId ?? null,
    {}
  );
  return NextResponse.json({ ok: true, id: row.id });
}
