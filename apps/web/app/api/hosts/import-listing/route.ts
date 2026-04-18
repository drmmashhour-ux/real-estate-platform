import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { hostEconomicsFlags } from "@/config/feature-flags";
import { listingImportSchema } from "@/modules/host-onboarding/onboarding.validation";
import { submitListingImport } from "@/modules/host-onboarding/onboarding.service";
import { trackFunnelEvent } from "@/lib/funnel/tracker";
import { logHostFunnelEvent } from "@/lib/host-funnel/logger";
import { checkRateLimit, getRateLimitHeaders } from "@/lib/rate-limit";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

/** POST /api/hosts/import-listing — stores URL; parsing is manual / async. */
export async function POST(req: Request) {
  if (!hostEconomicsFlags.hostOnboardingFunnelV1) {
    return NextResponse.json({ ok: false, error: "Feature disabled" }, { status: 403 });
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const rl = checkRateLimit(`host:import:${ip}`, { windowMs: 60_000, max: 25 });
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429, headers: getRateLimitHeaders(rl) });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = listingImportSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid body", details: parsed.error.flatten() }, { status: 400 });
  }

  const userId = await getGuestId();
  try {
    const row = await submitListingImport({
      ...parsed.data,
      userId: userId ?? null,
    });
    logHostFunnelEvent("listing_import_submitted", { id: row.id });
    void trackFunnelEvent("listing_import_submitted", { platform: parsed.data.sourcePlatform });
    return NextResponse.json({
      ok: true,
      importId: row.id,
      status: row.status,
      message: "URL saved — our team may follow up if automated import is unavailable.",
    });
  } catch (e) {
    console.error("host import", e);
    return NextResponse.json({ ok: false, error: "Could not save import" }, { status: 500 });
  }
}
