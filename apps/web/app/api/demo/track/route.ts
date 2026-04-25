import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { refId } = await req.json();
    const userAgent = req.headers.get("user-agent");
    const ip = req.headers.get("x-forwarded-for") || "unknown";

    await prisma.demoView.create({
      data: {
        refId,
        userAgent,
        ip,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DEMO_TRACK]", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
