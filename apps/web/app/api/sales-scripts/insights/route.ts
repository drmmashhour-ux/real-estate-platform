import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import {
  getConversionStats,
  listRecentCallLogs,
  suggestWinningCategories,
} from "@/modules/sales-scripts/sales-script-tracking.service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = new URL(req.url);
  const sinceDays = Math.min(365, Math.max(7, Number(url.searchParams.get("sinceDays")) || 90));

  const [stats, recent, suggestions] = await Promise.all([
    getConversionStats(sinceDays),
    listRecentCallLogs(40),
    suggestWinningCategories(4),
  ]);

  return NextResponse.json({ ok: true, stats, recent, suggestions });
}
