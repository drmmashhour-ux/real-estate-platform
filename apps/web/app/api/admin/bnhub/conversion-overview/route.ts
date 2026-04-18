import { getGuestId } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/is-platform-admin";
import { bnhubConversionLayerFlags } from "@/config/feature-flags";
import { loadBnhubConversionAdminOverview } from "@/modules/bnhub/conversion/bnhub-conversion-admin-overview.service";

export const dynamic = "force-dynamic";

/** Read-only BNHub conversion funnel rollup for operators (AiConversionSignal aggregates). */
export async function GET(req: Request) {
  const userId = await getGuestId();
  if (!userId || !(await isPlatformAdmin(userId))) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!bnhubConversionLayerFlags.adminV1) {
    return Response.json({ error: "BNHub conversion admin panel disabled" }, { status: 403 });
  }

  const url = new URL(req.url);
  const wd = Number(url.searchParams.get("windowDays") ?? "30");
  const windowDays = Number.isFinite(wd) ? wd : 30;

  const overview = await loadBnhubConversionAdminOverview(windowDays);
  return Response.json(overview);
}
