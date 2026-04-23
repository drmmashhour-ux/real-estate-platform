import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { assertKnownDomain } from "@/modules/autopilot-governance/autopilot-domain-matrix.service";
import type { KillSwitchPosition } from "@/modules/autopilot-governance/autopilot-domain-matrix.types";
import { setDomainKillSwitch } from "@/modules/autopilot-governance/autopilot-kill-switch.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, ctx: { params: Promise<{ domainId: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { domainId } = await ctx.params;
  if (!assertKnownDomain(domainId)) {
    return NextResponse.json({ error: "unknown_domain" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const position = body.position as KillSwitchPosition;
  const reason = typeof body.reason === "string" ? body.reason : "kill_switch_change";

  if (!["ON", "OFF", "LIMITED"].includes(position)) {
    return NextResponse.json({ error: "invalid_position" }, { status: 400 });
  }

  try {
    await setDomainKillSwitch({
      domain: domainId,
      position,
      actorUserId: auth.userId,
      reason,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[full-autopilot/kill-switch]", e);
    return NextResponse.json({ error: "kill_switch_failed" }, { status: 500 });
  }
}
