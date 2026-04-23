import { NextResponse } from "next/server";
import { getAdminUser } from "@/lib/auth";
import { listMarketplacePendingApprovals } from "@/modules/autonomy/darlink-approval.service";

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  const pending = await listMarketplacePendingApprovals();
  return NextResponse.json({ ok: true, pending });
}
