import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { getMaskedSampleLeadPreview } from "@/modules/growth/broker-prospect.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const preview = await getMaskedSampleLeadPreview();
  if (!preview) {
    return NextResponse.json({ error: "No lead available for preview yet" }, { status: 404 });
  }
  return NextResponse.json({ preview });
}
