import { NextRequest, NextResponse } from "next/server";
import { LecipmBrokerAutopilotMode, PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@repo/db";
import {
  prismaAutopilotModeToUi,
  uiAutopilotModeToPrisma,
  type AutopilotUiMode,
} from "@/modules/messaging/autopilot/autopilot.types";
import { logInfo } from "@/lib/logger";

export const dynamic = "force-dynamic";

const TAG = "[autopilot]";

export async function GET() {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) {
    return NextResponse.json({ error: "Brokers only" }, { status: 403 });
  }

  let row = await prisma.lecipmBrokerAutopilotSetting.findUnique({
    where: { brokerUserId: userId },
  });
  if (!row) {
    row = await prisma.lecipmBrokerAutopilotSetting.create({
      data: {
        brokerUserId: userId,
        mode: LecipmBrokerAutopilotMode.assist,
      },
    });
  }

  logInfo(`${TAG} settings.get`, { brokerUserId: userId });

  return NextResponse.json({
    mode: prismaAutopilotModeToUi(row.mode),
    rawMode: row.mode,
    pauseUntil: row.pauseUntil?.toISOString() ?? null,
    autoDraftFollowups: row.autoDraftFollowups,
    autoSuggestVisits: row.autoSuggestVisits,
    autoPrioritizeHotLeads: row.autoPrioritizeHotLeads,
    dailyDigestEnabled: row.dailyDigestEnabled,
  });
}

export async function PATCH(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) {
    return NextResponse.json({ error: "Brokers only" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    mode?: AutopilotUiMode;
  };

  if (!body.mode || typeof body.mode !== "string") {
    return NextResponse.json({ error: "mode required" }, { status: 400 });
  }

  const prismaMode = uiAutopilotModeToPrisma(body.mode);

  const row = await prisma.lecipmBrokerAutopilotSetting.upsert({
    where: { brokerUserId: userId },
    create: {
      brokerUserId: userId,
      mode: prismaMode,
    },
    update: { mode: prismaMode },
  });

  logInfo(`${TAG} settings.patch`, { mode: row.mode });

  return NextResponse.json({
    mode: prismaAutopilotModeToUi(row.mode),
    rawMode: row.mode,
  });
}
