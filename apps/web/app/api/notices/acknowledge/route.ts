import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { noticeId, userId, draftId } = await req.json();

    if (!noticeId) {
      return NextResponse.json({ error: "Notice ID is required" }, { status: 400 });
    }

    const log = await prisma.noticeLog.create({
      data: {
        noticeId,
        userId,
        draftId,
        accepted: true,
      },
    });

    return NextResponse.json({ success: true, logId: log.id });
  } catch (err) {
    console.error("[api:notices:acknowledge] error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
