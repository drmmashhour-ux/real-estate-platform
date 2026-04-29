import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { ref, userId, leadId } = body;
    
    const userAgent = req.headers.get("user-agent") || undefined;
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;

    await prisma.demoView.create({
      data: {
        ref,
        userId,
        leadId,
        userAgent,
        ip,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[DEMO_TRACK]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
