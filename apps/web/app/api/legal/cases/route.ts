import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jurisdiction = searchParams.get("jurisdiction")?.trim();
    const category = searchParams.get("category")?.trim();
    const sellerLiable = searchParams.get("sellerLiable");
    const brokerLiable = searchParams.get("brokerLiable");
    const latentDefect = searchParams.get("latentDefect");

    const cases = await prisma.legalCase.findMany({
      where: {
        ...(jurisdiction ? { jurisdiction } : {}),
        ...(category ? { category } : {}),
        ...(sellerLiable === "true" ? { sellerLiable: true } : sellerLiable === "false" ? { sellerLiable: false } : {}),
        ...(brokerLiable === "true" ? { brokerLiable: true } : brokerLiable === "false" ? { brokerLiable: false } : {}),
        ...(latentDefect === "true" ? { latentDefect: true } : latentDefect === "false" ? { latentDefect: false } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ cases });
  } catch (e) {
    console.error("GET /api/legal/cases", e);
    return NextResponse.json({ error: "Failed to load cases", cases: [] }, { status: 200 });
  }
}
