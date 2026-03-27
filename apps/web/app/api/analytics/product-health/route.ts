import { NextResponse } from "next/server";
import { getProductHealth } from "@/modules/analytics/services/product-health";

export const dynamic = "force-dynamic";

/**
 * Public aggregate hints for UX (save tooltip, compare highlight). No auth.
 */
export async function GET() {
  try {
    const h = await getProductHealth(30);
    return NextResponse.json({
      ok: true,
      showSaveHint: h.showSaveHint,
      highlightCompare: h.highlightCompare,
      days: h.days,
    });
  } catch (e) {
    console.error("[product-health]", e);
    return NextResponse.json(
      { ok: true, showSaveHint: false, highlightCompare: false, days: 30 },
      { status: 200 }
    );
  }
}
