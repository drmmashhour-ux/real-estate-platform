import { NextResponse } from "next/server";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { requireF1Admin } from "@/lib/payment-f1-admin";
import { runF1Confirm } from "@/lib/payment-f1-service";
import { revalidateF1AfterConfirm } from "@/lib/payment-f1-revalidate";

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
  const requestId = typeof (body as { requestId?: unknown }).requestId === "string" ? (body as { requestId: string }).requestId.trim() : "";
  if (!requestId) {
    return NextResponse.json({ ok: false, error: "missing_request_id" }, { status: 400 });
  }

  const out = await runF1Confirm(requestId);

  if (out.type === "not_found") {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  if (out.type === "rejected" || out.type === "bad_state") {
    return NextResponse.json({ ok: false, error: "invalid_state" }, { status: 400 });
  }
  if (out.type === "listing_missing") {
    return NextResponse.json({ ok: false, error: "listing_missing" }, { status: 404 });
  }
  if (out.type === "already") {
    revalidateF1AfterConfirm(out.listingId);
    return NextResponse.json({ ok: true, already: true, listingId: out.listingId });
  }

  revalidateF1AfterConfirm(out.listingId);
  return NextResponse.json({ ok: true, listingId: out.listingId });
}
