import { NextResponse } from "next/server";
import { getNotaryPackage } from "@/modules/transactions/transaction-notary.service";
import { requireBrokerOrAdminTransactionSession } from "@/lib/transactions/require-sd-transaction-session";
import { getTransactionById } from "@/modules/transactions/transaction.service";
import { canAccessTransaction } from "@/modules/transactions/transaction-policy";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireBrokerOrAdminTransactionSession();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const tx = await getTransactionById(id);
  if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccessTransaction(auth.role, auth.userId, tx.brokerId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pkg = await getNotaryPackage(id);
  return NextResponse.json({
    transactionNumber: tx.transactionNumber,
    notaryPackage: pkg,
  });
}
