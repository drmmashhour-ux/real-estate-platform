import { requireAdmin } from "@/modules/security/access-guard.service";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    // @ts-ignore
    const entities = await prisma.empireEntity.findMany({
      include: {
        roles: true,
        ownershipsAsChild: { include: { parentEntity: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ entities });
  } catch (error) {
    console.error("[empire:api] entities failed", error);
    return NextResponse.json({ error: "Failed to fetch entities" }, { status: 500 });
  }
}
