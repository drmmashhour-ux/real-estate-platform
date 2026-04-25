import { NextRequest, NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { sendExecutiveReport } from "@/modules/executive-reporting/email-delivery.service";

export const dynamic = "force-dynamic";

/** POST { reportId, recipients: string[] } */
export async function POST(req: NextRequest) {
  try {
    const userId = await getGuestId();
    if (!userId) return NextResponse.json({ ok: false, error: "Sign in required" }, { status: 401 });
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!u || u.role !== PlatformRole.ADMIN) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const body = (await req.json().catch(() => null)) as { reportId?: string; recipients?: string[] } | null;
    const reportId = body?.reportId?.trim();
    const recipients = Array.isArray(body?.recipients) ? body!.recipients! : [];
    if (!reportId) {
      return NextResponse.json({ ok: false, error: "reportId_required" }, { status: 400 });
    }

    const result = await sendExecutiveReport(reportId, recipients);
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 200 });
    }
    return NextResponse.json({ ok: true, recipients: result.recipients }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 200 });
  }
}
