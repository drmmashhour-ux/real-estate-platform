import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { syncProspectConversionsFromLeadUnlockPayments } from "@/modules/growth/broker-prospect.service";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const result = await syncProspectConversionsFromLeadUnlockPayments();
  return NextResponse.json(result);
}
