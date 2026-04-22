import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { requireBrokerOrAdminTransactionSession } from "@/lib/transactions/require-sd-transaction-session";
import { getTransactionById } from "@/modules/transactions/transaction.service";
import { canAccessTransaction } from "@/modules/transactions/transaction-policy";
import {
  createOrGetFinancial,
  getFinancial,
  updateFinancialApproval,
} from "@/modules/transactions/transaction-financial.service";

export const dynamic = "force-dynamic";

async function guard(id: string, auth: { userId: string; role: string }) {
  const tx = await getTransactionById(id);
  if (!tx) return { ok: false as const, response: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  if (!canAccessTransaction(auth.role, auth.userId, tx.brokerId)) {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true as const, tx };
}

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireBrokerOrAdminTransactionSession();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const g = await guard(id, auth);
  if (!g.ok) return g.response;

  const row = await getFinancial(id);
  return NextResponse.json({
    transactionNumber: g.tx.transactionNumber,
    financial: row,
  });
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireBrokerOrAdminTransactionSession();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const g = await guard(id, auth);
  if (!g.ok) return g.response;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const initOnly = body.init === true;
  if (initOnly) {
    const row = await createOrGetFinancial(id);
    return NextResponse.json({ transactionNumber: g.tx.transactionNumber, financial: row });
  }

  const approvalStatus = typeof body.approvalStatus === "string" ? body.approvalStatus : "";
  if (!approvalStatus) return NextResponse.json({ error: "approvalStatus required" }, { status: 400 });

  try {
    const row = await updateFinancialApproval({
      transactionId: id,
      lenderName: typeof body.lenderName === "string" ? body.lenderName : null,
      brokerName: typeof body.brokerName === "string" ? body.brokerName : null,
      approvalStatus,
      approvedAmount: typeof body.approvedAmount === "number" ? body.approvedAmount : null,
      interestRate: typeof body.interestRate === "number" ? body.interestRate : null,
      conditionsJson: body.conditionsJson as object | null,
      approvalDate: typeof body.approvalDate === "string" ? new Date(body.approvalDate) : null,
    });
    return NextResponse.json({ transactionNumber: g.tx.transactionNumber, financial: row });
  } catch (e) {
    logError("[sd.financial.post]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
