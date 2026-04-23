import { NextResponse } from "next/server";

import { requireMobileAdmin } from "@/modules/auth/mobile-auth";
import { listMobileExecutions } from "@/modules/autopilot-governance/full-autopilot-mobile.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await requireMobileAdmin(request);
  } catch (e) {
    const status = (e as Error & { status?: number })?.status ?? 401;
    return NextResponse.json({ error: "Unauthorized" }, { status });
  }

  try {
    const url = new URL(request.url);
    const take = Math.min(Number(url.searchParams.get("take") ?? "40") || 40, 100);
    const rows = await listMobileExecutions(take);
    return NextResponse.json({ executions: rows });
  } catch (e) {
    console.error("[mobile full-autopilot executions]", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
