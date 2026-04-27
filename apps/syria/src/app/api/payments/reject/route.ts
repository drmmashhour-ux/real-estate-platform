import { NextResponse } from "next/server";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { getAdminUser } from "@/lib/auth";
import { requireF1Admin } from "@/lib/payment-f1-admin";
import { runF1Reject } from "@/lib/payment-f1-service";
import { revalidateF1ListingOnly } from "@/lib/payment-f1-revalidate";
import { logSecurityEvent } from "@/lib/sybnb/sybnb-security-log";

export async function POST(req: Request) {
  const gate = await requireF1Admin(req);
  if (gate) return gate;

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
  const o = body as Record<string, unknown>;
  const requestId = typeof o.requestId === "string" ? o.requestId.trim() : "";
  const reason = typeof o.reason === "string" ? o.reason.trim() : "";
  if (!requestId) {
    return NextResponse.json({ ok: false, error: "missing_request_id" }, { status: 400 });
  }

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const admin = await getAdminUser();
  const out = await runF1Reject(requestId, reason, { adminId: admin?.id ?? null, clientIp });
  if (admin && out.type === "ok") {
    void logSecurityEvent({
      action: "f1_payment_rejected",
      userId: admin.id,
      metadata: { requestId, reason: reason || null, listingId: out.listingId },
    });
  }
  if (out.type === "not_found") {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  if (out.type === "already") {
    return NextResponse.json({ ok: true, already: true, status: out.status });
  }

  revalidateF1ListingOnly(out.listingId);
  return NextResponse.json({ ok: true });
}
