import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { adminAutonomyRejectBodySchema } from "@/modules/autonomous-marketplace/api/admin-autonomy.schema";
import { rejectPendingAction } from "@/modules/autonomous-marketplace/execution/action-approval.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!engineFlags.autonomyApprovalsV1) {
    return NextResponse.json({ error: "Approvals disabled" }, { status: 403 });
  }

  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = adminAutonomyRejectBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", issues: parsed.error.flatten() }, { status: 400 });
  }

  const result = await rejectPendingAction({
    approvalId: parsed.data.approvalId,
    actorUserId: auth.userId ?? "unknown",
    reason: parsed.data.reason,
  });

  if (!result.ok) {
    return NextResponse.json({ error: "not_found_or_failed" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, status: result.status });
}
