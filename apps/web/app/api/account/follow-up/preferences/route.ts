import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.clientCelebrationProfile.findUnique({
    where: { userId },
    select: {
      birthDate: true,
      allowBirthdayTouch: true,
      lastBirthdaySentAt: true,
    },
  });

  return NextResponse.json({
    profile: profile
      ? {
          birthDate: profile.birthDate?.toISOString().slice(0, 10) ?? null,
          allowBirthdayTouch: profile.allowBirthdayTouch,
          lastBirthdaySentAt: profile.lastBirthdaySentAt?.toISOString() ?? null,
        }
      : null,
  });
}

export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const allowBirthdayTouch = body?.allowBirthdayTouch === true;
  const birthDateRaw = typeof body?.birthDate === "string" ? body.birthDate.trim() : "";
  const birthDate = birthDateRaw ? new Date(`${birthDateRaw}T00:00:00.000Z`) : null;

  if (birthDateRaw && Number.isNaN(birthDate?.getTime())) {
    return NextResponse.json({ error: "Invalid birthDate" }, { status: 400 });
  }

  const profile = await prisma.clientCelebrationProfile.upsert({
    where: { userId },
    update: {
      allowBirthdayTouch,
      birthDate,
    },
    create: {
      userId,
      allowBirthdayTouch,
      birthDate,
    },
    select: {
      birthDate: true,
      allowBirthdayTouch: true,
      lastBirthdaySentAt: true,
    },
  });

  return NextResponse.json({
    ok: true,
    profile: {
      birthDate: profile.birthDate?.toISOString().slice(0, 10) ?? null,
      allowBirthdayTouch: profile.allowBirthdayTouch,
      lastBirthdaySentAt: profile.lastBirthdaySentAt?.toISOString() ?? null,
    },
  });
}
