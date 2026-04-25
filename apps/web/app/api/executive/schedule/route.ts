import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const userId = await getGuestId();
  if (!userId) return { error: NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 }) };
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!u) return { error: NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }) };
  if (u.role !== PlatformRole.ADMIN) {
    return { error: NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 }) };
  }
  return {};
}

export async function GET() {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;
  try {
    const rows = await prisma.executiveReportSchedule.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ ok: true, schedules: rows }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 200 });
  }
}

/** POST { frequency, recipients: string[], isActive? } */
export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if ("error" in gate) return gate.error;
  try {
    const body = (await req.json().catch(() => null)) as {
      frequency?: string;
      recipients?: string[];
      isActive?: boolean;
    } | null;

    const freqRaw = body?.frequency?.toUpperCase();
    const frequency = freqRaw === "WEEKLY" ? "WEEKLY" : freqRaw === "MONTHLY" ? "MONTHLY" : null;
    if (!frequency) {
      return NextResponse.json({ ok: false, error: "frequency_invalid" }, { status: 400 });
    }
    const recipients = Array.isArray(body?.recipients) ? body!.recipients.filter((x) => typeof x === "string") : [];
    const row = await prisma.executiveReportSchedule.create({
      data: {
        frequency,
        recipientsJson: recipients,
        isActive: body?.isActive !== false,
      },
    });
    return NextResponse.json({ ok: true, schedule: row }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 200 });
  }
}
