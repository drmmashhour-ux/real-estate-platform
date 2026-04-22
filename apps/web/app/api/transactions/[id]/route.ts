import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { requireBrokerOrAdminTransactionSession } from "@/lib/transactions/require-sd-transaction-session";
import { getTransactionById } from "@/modules/transactions/transaction.service";
import { canAccessTransaction } from "@/modules/transactions/transaction-policy";
import { toTransactionWire } from "@/modules/transactions/transaction.types";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireBrokerOrAdminTransactionSession();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id?.trim()) return NextResponse.json({ error: "id required" }, { status: 400 });

  try {
    const row = await getTransactionById(id);
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (!canAccessTransaction(auth.role, auth.userId, row.brokerId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      transactionNumber: row.transactionNumber,
      transaction: {
        ...toTransactionWire(row),
        brokerName: row.broker?.name ?? null,
        brokerEmail: row.broker?.email ?? null,
        listingTitle: row.listing?.title ?? null,
        listingCode: row.listing?.listingCode ?? null,
        propertyAddress: row.property ? `${row.property.address}, ${row.property.city}` : null,
      },
    });
  } catch (e) {
    logError("[transaction.api.get]", { error: e });
    return NextResponse.json({ error: "Failed to load transaction" }, { status: 500 });
  }
}
