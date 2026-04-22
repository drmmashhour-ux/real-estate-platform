import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { prepareNotaryPackage } from "@/modules/transactions/transaction-notary.service";
import { requireBrokerOrAdminTransactionSession } from "@/lib/transactions/require-sd-transaction-session";
import { getTransactionById } from "@/modules/transactions/transaction.service";
import { canAccessTransaction } from "@/modules/transactions/transaction-policy";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireBrokerOrAdminTransactionSession();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const tx = await getTransactionById(id);
  if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccessTransaction(auth.role, auth.userId, tx.brokerId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await prepareNotaryPackage(id);
    return NextResponse.json({
      transactionNumber: tx.transactionNumber,
      package: result.package,
      payload: result.payload,
    });
  } catch (e) {
    logError("[sd.notary.prepare]", { error: e });
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
