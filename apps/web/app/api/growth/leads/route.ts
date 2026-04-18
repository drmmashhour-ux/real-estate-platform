import { NextResponse } from "next/server";
import { listGrowthLeadsForUser } from "@/modules/lead-gen";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  const leads = await listGrowthLeadsForUser({ userId: auth.userId, role: auth.role, take: 100 });
  return NextResponse.json({
    leads: leads.map((l) => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
    })),
  });
}
