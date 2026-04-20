import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const onlyEnabled = request.nextUrl.searchParams.get("enabled");
    const rules = await prisma.legalRule.findMany({
      where: onlyEnabled === "false" ? {} : { enabled: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ rules });
  } catch (e) {
    console.error("GET /api/legal/rules", e);
    return NextResponse.json({ rules: [] }, { status: 200 });
  }
}
