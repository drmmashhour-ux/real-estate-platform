import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { revalidateSyriaPaths } from "@/lib/revalidate-locale";
import {
  normalizeMarketplaceReportReason,
  submitSyriaPropertyListingReport,
} from "@/lib/syria/property-listing-report";
import { sybnbCheck5PerMin } from "@/lib/sybnb/sybnb-rate-5per-min";
import { s2GetClientIp } from "@/lib/security/s2-ip";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteParams): Promise<Response> {
  try {
    assertDarlinkRuntimeEnv();
  } catch {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const ip = s2GetClientIp(req);
  const rl = sybnbCheck5PerMin(`marketplace_listing_report:${ip}`);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limit" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const reason = normalizeMarketplaceReportReason(
    raw && typeof raw === "object" && raw !== null && "reason" in raw ?
      (raw as { reason?: unknown }).reason
    : undefined,
  );
  if (!reason) {
    return NextResponse.json({ ok: false, error: "invalid_reason" }, { status: 400 });
  }

  const { id: listingId } = await context.params;
  const propertyId = String(listingId ?? "").trim();
  if (!propertyId) {
    return NextResponse.json({ ok: false, error: "invalid_id" }, { status: 400 });
  }

  const res = await submitSyriaPropertyListingReport({
    propertyId,
    reporterId: user.id,
    reason,
  });

  if (!res.ok) {
    const status = res.error === "not_found" ? 404 : 400;
    return NextResponse.json({ ok: false, error: res.error }, { status });
  }

  await revalidateSyriaPaths("/", "/listing", `/listing/${propertyId}`);
  return NextResponse.json({ ok: true });
}
