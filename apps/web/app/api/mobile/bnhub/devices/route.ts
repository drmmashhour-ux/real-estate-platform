import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { requireMobileGuestUser } from "@/lib/bnhub/mobile-api";
import { upsertPushDeviceForUser } from "@/lib/mobile/upsert-push-device";

export const dynamic = "force-dynamic";

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

export async function DELETE(request: NextRequest) {
  const user = await requireMobileGuestUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  if (!token) {
    return NextResponse.json({ error: "token is required" }, { status: 400 });
  }

  const result = await prisma.mobileDeviceToken.updateMany({
    where: {
      userId: user.id,
      token,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
      lastSeenAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, updatedCount: result.count });
}
