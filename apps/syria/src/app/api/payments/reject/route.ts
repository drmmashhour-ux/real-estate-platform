import { NextResponse } from "next/server";
import { assertDarlinkRuntimeEnv } from "@/lib/guard";
import { requireF1Admin } from "@/lib/payment-f1-admin";
import { prisma } from "@/lib/db";

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

  const row = await prisma.syriaPaymentRequest.findUnique({ where: { id: requestId } });
  if (!row) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }
  if (row.status !== "pending") {
    return NextResponse.json({ ok: true, already: true, status: row.status });
  }

  const note = reason ? `rejected: ${reason}` : "rejected";
  const mergedNote = row.note ? `${row.note}\n${note}` : note;

  await prisma.$transaction([
    prisma.syriaPaymentRequest.update({
      where: { id: requestId },
      data: { status: "rejected", note: mergedNote },
    }),
    prisma.syriaListingFinance.upsert({
      where: { listingId: row.listingId },
      create: {
        listingId: row.listingId,
        totalRequests: 0,
        totalConfirmed: 0,
        lastStatus: "rejected",
      },
      update: { lastStatus: "rejected" },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
