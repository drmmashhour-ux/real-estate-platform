import { NextResponse } from "next/server";
import { recordCommandCenterAudit } from "@/modules/command-center/command-center-ai-audit.service";
import { requireCommandCenterActor } from "@/modules/command-center/command-center-api-guard";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const actor = await requireCommandCenterActor();
  if (!actor.ok) return actor.response;

  const body = await req.json().catch(() => ({}));
  const key = typeof body.key === "string" ? body.key : "";
  const href = typeof body.href === "string" ? body.href : "";
  const label = typeof body.label === "string" ? body.label : undefined;

  if (!key || !href) {
    return NextResponse.json({ error: "key and href required" }, { status: 400 });
  }

  await recordCommandCenterAudit({
    actorUserId: actor.userId,
    event: "quick_action_used",
    payload: { key, href, label },
  });

  return NextResponse.json({ success: true });
}
