import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { assertKnownDomain } from "@/modules/autopilot-governance/autopilot-domain-matrix.service";
import type { FullAutopilotMode } from "@/modules/autopilot-governance/autopilot-domain-matrix.types";
import { setDomainMode } from "@/modules/autopilot-governance/autopilot-domain-mode.service";

export const dynamic = "force-dynamic";

export async function POST(request: Request, ctx: { params: Promise<{ domainId: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { domainId } = await ctx.params;
  if (!assertKnownDomain(domainId)) {
    return NextResponse.json({ error: "unknown_domain" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const mode = body.mode as FullAutopilotMode;
  const reason = typeof body.reason === "string" ? body.reason : "mode_change";

  const allowed = [
    "OFF",
    "ASSIST",
    "SAFE_AUTOPILOT",
    "FULL_AUTOPILOT_APPROVAL",
    "FULL_AUTOPILOT_BOUNDED",
  ];
  if (!allowed.includes(mode)) {
    return NextResponse.json({ error: "invalid_mode" }, { status: 400 });
  }

  try {
    await setDomainMode({
      domain: domainId,
      mode,
      actorUserId: auth.userId,
      reason,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[full-autopilot/domain/mode]", e);
    return NextResponse.json({ error: "mode_failed" }, { status: 500 });
  }
}
