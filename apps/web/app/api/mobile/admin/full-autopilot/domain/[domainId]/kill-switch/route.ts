import { NextResponse } from "next/server";

import { requireMobileAdmin } from "@/modules/auth/mobile-auth";
import { assertKnownDomain } from "@/modules/autopilot-governance/autopilot-domain-matrix.service";
import type { KillSwitchPosition } from "@/modules/autopilot-governance/autopilot-domain-matrix.types";
import { setDomainKillSwitch } from "@/modules/autopilot-governance/autopilot-kill-switch.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, ctx: { params: Promise<{ domainId: string }> }) {
  let userId: string;
  try {
    const u = await requireMobileAdmin(request);
    userId = u.id;
  } catch (e) {
    const status = (e as Error & { status?: number })?.status ?? 401;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }

  const { domainId } = await ctx.params;
  if (!assertKnownDomain(domainId)) {
    return NextResponse.json({ error: "unknown_domain" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const position = body.position as KillSwitchPosition;
  const reason = typeof body.reason === "string" ? body.reason : "mobile_kill_switch";

  if (!["ON", "OFF", "LIMITED"].includes(position)) {
    return NextResponse.json({ error: "invalid_position" }, { status: 400 });
  }

  await setDomainKillSwitch({
    domain: domainId,
    position,
    actorUserId: userId,
    reason,
  });

  return NextResponse.json({ ok: true });
}
