import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin/require-admin";
import { acknowledgeLegalAlertSafe } from "@/modules/legal/repositories/legal-alert.repository";

export const dynamic = "force-dynamic";

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { id } = await context.params;
  const ok = await acknowledgeLegalAlertSafe(id, auth.userId);
  return NextResponse.json({ ok });
}
