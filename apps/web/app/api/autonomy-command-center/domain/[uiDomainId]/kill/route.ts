import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import type { AutonomyUiDomainId } from "@/modules/autonomy-command-center/autonomy-command-center.groups";
import { killUiDomainGroup } from "@/modules/autonomy-command-center/autonomy-command-center-domain-ui.service";

export const dynamic = "force-dynamic";

const UI_IDS = new Set<string>([
  "marketing",
  "sales_ai",
  "booking",
  "no_show",
  "post_visit",
  "deal_intelligence",
  "investment_allocator",
  "marketplace",
  "compliance",
]);

export async function POST(_request: Request, ctx: { params: Promise<{ uiDomainId: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { uiDomainId } = await ctx.params;
  if (!UI_IDS.has(uiDomainId)) {
    return NextResponse.json({ error: "unknown_ui_domain" }, { status: 400 });
  }

  try {
    await killUiDomainGroup(auth.userId, uiDomainId as AutonomyUiDomainId);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[autonomy-command-center/domain/kill]", e);
    return NextResponse.json({ error: "kill_failed" }, { status: 500 });
  }
}
