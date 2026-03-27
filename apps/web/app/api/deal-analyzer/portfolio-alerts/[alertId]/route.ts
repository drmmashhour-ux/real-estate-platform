import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { isDealAnalyzerEnabled, isDealAnalyzerAlertsEnabled } from "@/modules/deal-analyzer/config";
import { dismissAlert, markAlertRead } from "@/modules/deal-analyzer/infrastructure/services/portfolioAlertService";
import { z } from "zod";

export const dynamic = "force-dynamic";

const patchBodySchema = z.object({
  action: z.enum(["read", "dismiss"]),
});

export async function PATCH(request: Request, context: { params: Promise<{ alertId: string }> }) {
  if (!isDealAnalyzerEnabled() || !isDealAnalyzerAlertsEnabled()) {
    return NextResponse.json({ error: "Deal Analyzer alerts disabled" }, { status: 503 });
  }
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { alertId } = await context.params;

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const parsed = patchBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const row =
    parsed.data.action === "dismiss"
      ? await dismissAlert({ alertId, userId })
      : await markAlertRead({ alertId, userId });

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, status: row.status });
}
