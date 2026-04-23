import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin/require-admin";
import type { AutonomyUiDomainId } from "@/modules/autonomy-command-center/autonomy-command-center.groups";
import { applyUiDomainSlot } from "@/modules/autonomy-command-center/autonomy-command-center-domain-ui.service";
import type { DomainMatrixUiSlot } from "@/modules/autonomy-command-center/autonomy-command-center.pure";

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

export async function POST(request: Request, ctx: { params: Promise<{ uiDomainId: string }> }) {
  const auth = await requireAdminSession();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { uiDomainId } = await ctx.params;
  if (!UI_IDS.has(uiDomainId)) {
    return NextResponse.json({ error: "unknown_ui_domain" }, { status: 400 });
  }

  const body = await request.json().catch(() => ({}));
  const slot = body.slot as DomainMatrixUiSlot;
  if (slot !== "OFF" && slot !== "ASSIST" && slot !== "SAFE" && slot !== "FULL") {
    return NextResponse.json({ error: "invalid_slot" }, { status: 400 });
  }

  try {
    await applyUiDomainSlot({
      actorUserId: auth.userId,
      uiDomainId: uiDomainId as AutonomyUiDomainId,
      slot,
      reason: typeof body.reason === "string" ? body.reason : undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[autonomy-command-center/domain/slot]", e);
    return NextResponse.json({ error: "slot_failed" }, { status: 500 });
  }
}
