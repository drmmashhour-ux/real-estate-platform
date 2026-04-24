import { NextResponse } from "next/server";
import { detectNotices } from "@/modules/notice-engine/noticeEngine";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.context) {
      return NextResponse.json({ error: "Context is required" }, { status: 400 });
    }

    const notices = detectNotices(body.context);

    return NextResponse.json({ notices });
  } catch (err) {
    console.error("[api:notices:apply] error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
