import { NextResponse } from "next/server";
import { listReferralsForUser } from "@/modules/referrals";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;
  const rows = await listReferralsForUser(auth.userId);
  return NextResponse.json({
    referrals: rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      usedAt: r.usedAt?.toISOString() ?? null,
    })),
  });
}
