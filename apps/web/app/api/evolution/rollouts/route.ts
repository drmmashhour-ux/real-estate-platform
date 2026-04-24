import { requireAdmin } from "@/modules/security/access-guard.service";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    // @ts-ignore
    const rollouts = await prisma.policyRollout.findMany({
      include: {
        policyAdjustment: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ rollouts });
  } catch (error) {
    console.error("[evolution-rollout:api] list failed", error);
    return NextResponse.json({ error: "Failed to fetch rollouts" }, { status: 500 });
  }
}
