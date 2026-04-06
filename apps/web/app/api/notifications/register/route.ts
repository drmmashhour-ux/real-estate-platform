import { NextRequest, NextResponse } from "next/server";
import { requireMobileGuestUser } from "@/lib/bnhub/mobile-api";
import { upsertPushDeviceForUser } from "@/lib/mobile/upsert-push-device";

export const dynamic = "force-dynamic";

/**
 * Registers an Expo / FCM push token for the authenticated user (same storage as `/api/mobile/bnhub/devices`).
 * Accepts BNHub session Bearer or Supabase JWT (see `requireMobileGuestUser`).
 */
export async function POST(request: NextRequest) {
  const user = await requireMobileGuestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
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
