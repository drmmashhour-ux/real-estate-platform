import { NextResponse } from "next/server";
import { growthMissionControlFlags } from "@/config/feature-flags";
import { requireGrowthMachineActor } from "@/modules/growth-machine/growth-api-context";
import { recordMissionControlActionClick } from "@/modules/growth/growth-mission-control-monitoring.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!growthMissionControlFlags.growthMissionControlV1) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const auth = await requireGrowthMachineActor();
  if (!auth.ok) return auth.response;

  try {
    const body = (await req.json()) as {
      navTarget?: string;
      actionId?: string;
      role?: "top" | "list";
    };
    const navTarget = typeof body.navTarget === "string" ? body.navTarget : "";
    const actionId = typeof body.actionId === "string" ? body.actionId : "";
    const role = body.role === "list" ? "list" : "top";
    if (navTarget && actionId) {
      recordMissionControlActionClick({ navTarget, actionId, role });
    }
  } catch {
    /* monitoring only */
  }

  return NextResponse.json({ ok: true });
}
