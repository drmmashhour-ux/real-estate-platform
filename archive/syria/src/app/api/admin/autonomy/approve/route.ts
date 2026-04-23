import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { approveMarketplaceAction } from "@/modules/autonomy/darlink-approval.service";

export async function POST(req: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  try {
    const body = (await req.json()) as { approvalId?: string; notes?: string };
    const approvalId = typeof body.approvalId === "string" ? body.approvalId.trim() : "";
    if (!approvalId) {
      return NextResponse.json({ ok: false, error: "missing_approval_id" }, { status: 400 });
    }
    const res = await approveMarketplaceAction({
      approvalId,
      decidedByUserId: admin.id,
      notes: body.notes ?? undefined,
    });
    return NextResponse.json({ ok: res.ok, reason: res.reason });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
