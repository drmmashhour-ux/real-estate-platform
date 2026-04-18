import { NextResponse } from "next/server";
import { engineFlags } from "@/config/feature-flags";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { listPendingApprovals } from "@/modules/autonomous-marketplace/execution/action-approval.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!engineFlags.autonomyApprovalsV1) {
    return NextResponse.json({ error: "Approvals disabled" }, { status: 403 });
  }

  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = new URL(req.url);
  const take = Math.min(Number(url.searchParams.get("take") ?? "50"), 200);

  const { items } = await listPendingApprovals({ take });
  return NextResponse.json({ ok: true, items });
}
