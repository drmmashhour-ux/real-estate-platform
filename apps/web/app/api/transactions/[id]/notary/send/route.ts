import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { sendNotaryPackage } from "@/modules/transactions/transaction-notary.service";
import { requireBrokerOrAdminTransactionSession } from "@/lib/transactions/require-sd-transaction-session";
import { getTransactionById } from "@/modules/transactions/transaction.service";
import { canAccessTransaction } from "@/modules/transactions/transaction-policy";

export const dynamic = "force-dynamic";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireBrokerOrAdminTransactionSession();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const tx = await getTransactionById(id);
  if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!canAccessTransaction(auth.role, auth.userId, tx.brokerId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  try {
    const pkg = await sendNotaryPackage(
      id,
      typeof body.notaryName === "string" ? body.notaryName : null,
      typeof body.notaryEmail === "string" ? body.notaryEmail : null
    );
    return NextResponse.json({
      transactionNumber: tx.transactionNumber,
      notaryPackage: pkg,
    });
  } catch (e) {
    logError("[sd.notary.send]", { error: e });
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
