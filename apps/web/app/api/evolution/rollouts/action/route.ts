import { requireAdmin } from "@/modules/security/access-guard.service";
import { advanceRollout, rollbackRollout } from "@/modules/evolution/rollout.engine";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    const { rolloutId, action } = await req.json();
    if (!rolloutId || !action) {
      return NextResponse.json({ error: "rolloutId and action are required" }, { status: 400 });
    }

    let result;
    if (action === "advance") {
      result = await advanceRollout(rolloutId);
    } else if (action === "rollback") {
      result = await rollbackRollout(rolloutId);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, rollout: result });
  } catch (error) {
    console.error("[evolution-rollout:api] action failed", error);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
