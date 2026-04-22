import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { requireBrokerOrAdminTransactionSession } from "@/lib/transactions/require-sd-transaction-session";
import { getTransactionById } from "@/modules/transactions/transaction.service";
import { canAccessTransaction } from "@/modules/transactions/transaction-policy";
import { listTimeline } from "@/modules/transactions/transaction-timeline.service";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireBrokerOrAdminTransactionSession();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id?.trim()) return NextResponse.json({ error: "id required" }, { status: 400 });

  try {
    const tx = await getTransactionById(id);
    if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canAccessTransaction(auth.role, auth.userId, tx.brokerId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const events = await listTimeline(id);

    return NextResponse.json({
      transactionNumber: tx.transactionNumber,
      timeline: events.map((e) => ({
        id: e.id,
        eventType: e.eventType,
        summary: e.summary,
        createdAt: e.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    logError("[transaction.api.timeline]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
