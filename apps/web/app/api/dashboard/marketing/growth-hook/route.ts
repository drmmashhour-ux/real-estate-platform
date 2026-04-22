import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import { runMarketingStrategyFromGrowthEngine } from "@/modules/marketing/marketing-strategy.service";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const result = await runMarketingStrategyFromGrowthEngine();
  return NextResponse.json({ ok: true, result });
}
