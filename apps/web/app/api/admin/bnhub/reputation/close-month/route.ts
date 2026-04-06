import { NextRequest } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdminSurface } from "@/lib/auth/is-platform-admin";
import { runMonthlyReputationClose } from "@/src/modules/reviews/reputationMonthlyService";

/**
 * POST — Close a calendar month: median guest/host scores, top 5 flags, listing search boost for top hosts.
 * Body: { periodYearMonth: "2026-02" } (UTC month bucket for review.createdAt / host evaluation createdAt).
 */
export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdminSurface(userId))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const periodYearMonth =
    typeof body.periodYearMonth === "string" ? body.periodYearMonth.trim() : "";
  if (!/^\d{4}-\d{2}$/.test(periodYearMonth)) {
    return Response.json(
      { error: "periodYearMonth required (YYYY-MM)" },
      { status: 400 }
    );
  }

  try {
    const result = await runMonthlyReputationClose(periodYearMonth);
    return Response.json({ ok: true, periodYearMonth, ...result });
  } catch (e) {
    console.error("[admin/bnhub/reputation/close-month]", e);
    return Response.json(
      { error: e instanceof Error ? e.message : "Close month failed" },
      { status: 400 }
    );
  }
}
