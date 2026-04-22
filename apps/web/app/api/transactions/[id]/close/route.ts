import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { closeTransactionIfAllowed } from "@/modules/transactions/transaction-closing.service";
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
    const result = await closeTransactionIfAllowed(id);
    if (!result.ok) {
      return NextResponse.json(
        {
          transactionNumber: tx.transactionNumber,
          ok: false,
          reasons: result.reasons,
        },
        { status: 409 }
      );
    }
    return NextResponse.json({
      transactionNumber: tx.transactionNumber,
      ok: true,
      status: "CLOSED",
    });
  } catch (e) {
    logError("[sd.close]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
