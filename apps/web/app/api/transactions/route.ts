import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { requireBrokerOrAdminTransactionSession } from "@/lib/transactions/require-sd-transaction-session";
import { createTransaction, listTransactions } from "@/modules/transactions/transaction.service";
import { toTransactionWire } from "@/modules/transactions/transaction.types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireBrokerOrAdminTransactionSession();
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const transactionType = typeof body.transactionType === "string" ? body.transactionType.trim() : "";
  if (!transactionType) {
    return NextResponse.json({ error: "transactionType required" }, { status: 400 });
  }

  const title = typeof body.title === "string" ? body.title : null;
  const listingId = typeof body.listingId === "string" ? body.listingId : null;
  const propertyId = typeof body.propertyId === "string" ? body.propertyId : null;
  const brokerIdBody = typeof body.brokerId === "string" ? body.brokerId.trim() : "";

  const brokerId =
    auth.role === "ADMIN" && brokerIdBody ?
      brokerIdBody
    : auth.userId;

  try {
    const row = await createTransaction(
      {
        brokerId,
        transactionType,
        title,
        listingId,
        propertyId,
      },
      auth.role
    );

    return NextResponse.json({
      transactionNumber: row.transactionNumber,
      transaction: toTransactionWire(row),
    });
  } catch (e) {
    logError("[transaction.api.create]", { error: e });
    const msg = e instanceof Error ? e.message : "Failed";
    const status =
      msg.includes("Forbidden") ? 403
      : msg.includes("not accessible") || msg.includes("not found") ? 403
      : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireBrokerOrAdminTransactionSession();
  if (!auth.ok) return auth.response;

  const url = req.nextUrl;
  const status = url.searchParams.get("status");
  const brokerFilterId =
    auth.role === "ADMIN" ?
      url.searchParams.get("brokerId") ?? url.searchParams.get("broker") ?? undefined
    : undefined;

  try {
    const rows = await listTransactions({
      brokerId: auth.userId,
      role: auth.role,
      status: status ?? undefined,
      brokerFilterId: brokerFilterId ?? undefined,
    });

    return NextResponse.json({
      transactions: rows.map((t) => ({
        ...toTransactionWire(t),
        listingTitle: t.listing?.title ?? null,
        listingCode: t.listing?.listingCode ?? null,
      })),
    });
  } catch (e) {
    logError("[transaction.api.list]", { error: e });
    return NextResponse.json({ error: "Failed to list transactions" }, { status: 500 });
  }
}
