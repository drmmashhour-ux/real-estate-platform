import { NextResponse } from "next/server";

import { upsertPushDeviceForUser } from "@/lib/mobile/upsert-push-device";
import { requireMobileUser } from "@/modules/auth/mobile-auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/mobile/notifications/register-token — Expo push token for Supabase JWT users.
 * Body: `{ token, platform: "ios"|"android", provider?: "expo", deviceName?, appVersion? }`
 */
export async function POST(request: Request) {
  let user;
  try {
    user = await requireMobileUser(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  try {
    const device = await upsertPushDeviceForUser(user.id, body);
    return NextResponse.json({
      ok: true,
      userId: user.id,
      device: {
        ...device,
        lastSeenAt: device.lastSeenAt.toISOString(),
      },
    });
  } catch (e) {
    const status = (e as Error & { status?: number }).status ?? 500;
    const message = e instanceof Error ? e.message : "Error";
    if (status === 400) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    throw e;
  }
}
