import { NextResponse } from "next/server";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { incrementListingLeadClicks } from "@/lib/lead-increment";
import { s2GetClientIp } from "@/lib/security/s2-ip";
import { hashSybn113ClientIp } from "@/lib/syria/share-abuse";

export async function POST(req: Request) {
  try {
    assertDarlinkRuntimeEnv();
  } catch {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }
  const listingId = typeof (body as { listingId?: unknown }).listingId === "string" ? (body as { listingId: string }).listingId.trim() : "";
  if (!listingId) {
    return NextResponse.json({ ok: false, error: "missing_listing_id" }, { status: 400 });
  }

  const ip = s2GetClientIp(req);
  const clientIpHash = hashSybn113ClientIp(ip);

  await incrementListingLeadClicks(listingId, "phoneClicks", { clientIpHash });
  return NextResponse.json({ ok: true });
}
