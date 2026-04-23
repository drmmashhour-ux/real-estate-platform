import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { buildAutonomyCommandCenterPayload } from "@/modules/autonomy-command-center/autonomy-command-center.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const payload = await buildAutonomyCommandCenterPayload();
    return NextResponse.json(payload);
  } catch (e) {
    console.error("[autonomy-command-center/summary]", e);
    return NextResponse.json({ error: "summary_failed" }, { status: 500 });
  }
}
