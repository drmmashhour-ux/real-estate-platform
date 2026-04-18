import { NextResponse } from "next/server";
import { requireAdminSurfaceSession } from "@/lib/admin/require-admin-surface-session";
import { buildMoneyOperatingSystemSnapshot } from "@/modules/revenue/money-os-aggregator.service";

export const dynamic = "force-dynamic";

/**
 * Money Operating System — read-only snapshot for admin UI (no mutations).
 */
export async function GET() {
  const auth = await requireAdminSurfaceSession();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const snapshot = await buildMoneyOperatingSystemSnapshot();
    return NextResponse.json({ snapshot });
  } catch (e) {
    console.error("[admin/money-os]", e);
    return NextResponse.json({ error: "Failed to build money snapshot" }, { status: 500 });
  }
}
