import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth/require-user";
import { logTurboDraftEvent } from "@/modules/turbo-form-drafting/auditLogger";

export async function POST(req: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const { draftId, noticeKey } = await req.json();

    if (!draftId || !noticeKey) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

    // @ts-ignore
    await prisma.turboDraftAcknowledgement.upsert({
      where: {
        draftId_noticeKey_userId: {
          draftId,
          noticeKey,
          userId: auth.user.id,
        },
      },
      update: {
        acceptedAt: new Date(),
        ipAddress: ip,
      },
      create: {
        draftId,
        noticeKey,
        userId: auth.user.id,
        acceptedAt: new Date(),
        ipAddress: ip,
      },
    });

    await logTurboDraftEvent({
      draftId,
      userId: auth.user.id,
      eventKey: "turbo_draft_notice_acknowledged",
      severity: "INFO",
      payload: { noticeKey, ip },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api:turbo-draft:acknowledge] error", err);
    return NextResponse.json({ error: "Acknowledgement failed" }, { status: 500 });
  }
}
