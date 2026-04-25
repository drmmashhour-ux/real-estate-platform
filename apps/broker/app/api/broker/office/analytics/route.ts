import { brokerageOfficeFlags } from "@/config/feature-flags";
import { roleCanViewOfficeFinance } from "@/lib/brokerage/office-access";
import { resolveBrokerOfficeRequest } from "@/lib/brokerage/resolve-office-api";
import type { OfficeAnalyticsWindow } from "@/modules/office-analytics/office-analytics.types";
import { getOfficeAnalytics } from "@/modules/office-analytics/office-analytics.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ctx = await resolveBrokerOfficeRequest(request, "officeFinanceAnalyticsV1");
  if ("error" in ctx) return ctx.error;
  if (!roleCanViewOfficeFinance(ctx.access.membership.role)) {
    return Response.json({ error: "Office finance visibility required" }, { status: 403 });
  }

  const url = new URL(request.url);
  const window = (url.searchParams.get("window") ?? "30d") as OfficeAnalyticsWindow;
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;
  const custom = from && to ? { from, to } : undefined;

  const analytics = await getOfficeAnalytics(ctx.officeId, window, custom);
  return Response.json({ analytics });
}
