import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSessionUserIdOr401 } from "@/lib/auth/api-session";
import { recordAuditEvent } from "@/modules/analytics/audit-log.service";

const OWNER_USER = "user";

const updateSchema = z.object({
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  pushEnabled: z.boolean().optional(),
  emailAddress: z.string().email().nullable().optional(),
  phoneNumber: z.string().min(3).nullable().optional(),
  alertNewDeals: z.boolean().optional(),
  alertPriceDrop: z.boolean().optional(),
  alertScoreChange: z.boolean().optional(),
  alertBuyBox: z.boolean().optional(),
  quietHoursStart: z.number().int().min(0).max(23).nullable().optional(),
  quietHoursEnd: z.number().int().min(0).max(23).nullable().optional(),
  consentGranted: z.boolean().optional(),
  emailOptIn: z.boolean().optional(),
  smsOptIn: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireSessionUserIdOr401(request);
  if (auth instanceof NextResponse) return auth;

  const preference = await prisma.notificationPreference.findUnique({
    where: { ownerType_ownerId: { ownerType: OWNER_USER, ownerId: auth.userId } },
  });

  return NextResponse.json({ preference });
}

export async function PUT(req: NextRequest) {
  const auth = await requireSessionUserIdOr401(req);
  if (auth instanceof NextResponse) return auth;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const preference = await prisma.notificationPreference.upsert({
    where: { ownerType_ownerId: { ownerType: OWNER_USER, ownerId: auth.userId } },
    create: {
      ownerType: OWNER_USER,
      ownerId: auth.userId,
      emailEnabled: data.emailEnabled ?? true,
      smsEnabled: data.smsEnabled ?? false,
      pushEnabled: data.pushEnabled ?? true,
      emailAddress: data.emailAddress ?? undefined,
      phoneNumber: data.phoneNumber ?? undefined,
      alertNewDeals: data.alertNewDeals ?? true,
      alertPriceDrop: data.alertPriceDrop ?? true,
      alertScoreChange: data.alertScoreChange ?? true,
      alertBuyBox: data.alertBuyBox ?? true,
      quietHoursStart: data.quietHoursStart ?? undefined,
      quietHoursEnd: data.quietHoursEnd ?? undefined,
      consentGranted: data.consentGranted ?? false,
      emailOptIn: data.emailOptIn ?? false,
      smsOptIn: data.smsOptIn ?? false,
    },
    update: {
      ...(data.emailEnabled !== undefined ? { emailEnabled: data.emailEnabled } : {}),
      ...(data.smsEnabled !== undefined ? { smsEnabled: data.smsEnabled } : {}),
      ...(data.pushEnabled !== undefined ? { pushEnabled: data.pushEnabled } : {}),
      ...(data.emailAddress !== undefined ? { emailAddress: data.emailAddress } : {}),
      ...(data.phoneNumber !== undefined ? { phoneNumber: data.phoneNumber } : {}),
      ...(data.alertNewDeals !== undefined ? { alertNewDeals: data.alertNewDeals } : {}),
      ...(data.alertPriceDrop !== undefined ? { alertPriceDrop: data.alertPriceDrop } : {}),
      ...(data.alertScoreChange !== undefined ? { alertScoreChange: data.alertScoreChange } : {}),
      ...(data.alertBuyBox !== undefined ? { alertBuyBox: data.alertBuyBox } : {}),
      ...(data.quietHoursStart !== undefined ? { quietHoursStart: data.quietHoursStart } : {}),
      ...(data.quietHoursEnd !== undefined ? { quietHoursEnd: data.quietHoursEnd } : {}),
      ...(data.consentGranted !== undefined ? { consentGranted: data.consentGranted } : {}),
      ...(data.emailOptIn !== undefined ? { emailOptIn: data.emailOptIn } : {}),
      ...(data.smsOptIn !== undefined ? { smsOptIn: data.smsOptIn } : {}),
    },
  });

  await recordAuditEvent({
    actorUserId: auth.userId,
    action: "NOTIFICATION_PREFERENCE_CHANGED",
    payload: { preferenceId: preference.id },
  });

  return NextResponse.json({ success: true, preference });
}
