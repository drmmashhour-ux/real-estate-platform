import { NextResponse } from "next/server";
import { requireBrokerAutopilotApiUser } from "@/lib/broker-autopilot/api-auth";
import { generateDailyBriefingForBroker } from "@/lib/broker-autopilot/generate-daily-briefing";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();

export const dynamic = "force-dynamic";

function utcDateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export async function GET() {
  const auth = await requireBrokerAutopilotApiUser();
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const day = utcDateOnly(new Date());
  const briefing = await prisma.lecipmBrokerDailyBriefing.findUnique({
    where: {
      brokerUserId_briefingDate: { brokerUserId: auth.user.id, briefingDate: day },
    },
  });

  return NextResponse.json({ briefing });
}

export async function POST() {
  const auth = await requireBrokerAutopilotApiUser();
  if (!auth.user) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const briefing = await generateDailyBriefingForBroker(auth.user.id, auth.user.role === "ADMIN");
  return NextResponse.json({ briefing });
}
