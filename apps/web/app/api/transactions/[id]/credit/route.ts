import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { requireBrokerOrAdminTransactionSession } from "@/lib/transactions/require-sd-transaction-session";
import { prisma } from "@/lib/db";
import { getTransactionById } from "@/modules/transactions/transaction.service";
import { canAccessTransaction } from "@/modules/transactions/transaction-policy";
import {
  createCreditCheck,
  fetchResult,
  sendRequest,
} from "@/modules/trustii/trustii.service";

export const dynamic = "force-dynamic";

async function guardTx(transactionId: string, auth: { userId: string; role: string }) {
  const tx = await getTransactionById(transactionId);
  if (!tx) return { ok: false as const, response: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  if (!canAccessTransaction(auth.role, auth.userId, tx.brokerId)) {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true as const, tx };
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireBrokerOrAdminTransactionSession();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const g = await guardTx(id, auth);
  if (!g.ok) return g.response;

  try {
    const rows = await prisma.lecipmTenantCreditCheck.findMany({
      where: { transactionId: id },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({
      checks: rows.map((r) => ({
        id: r.id,
        applicantName: r.applicantName,
        email: r.email,
        status: r.status,
        score: r.score,
        reportUrl: r.reportUrl,
        provider: r.provider,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    logError("[transactions.credit.list]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireBrokerOrAdminTransactionSession();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const g = await guardTx(id, auth);
  if (!g.ok) return g.response;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = typeof body.action === "string" ? body.action : "full";

  try {
    if (action === "refresh") {
      const checkId = typeof body.checkId === "string" ? body.checkId.trim() : "";
      if (!checkId) return NextResponse.json({ error: "checkId required" }, { status: 400 });
      const row = await prisma.lecipmTenantCreditCheck.findFirst({
        where: { id: checkId, transactionId: id },
      });
      if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
      if (row.status === "PENDING") await sendRequest(checkId);
      const payload = await fetchResult(checkId);
      return NextResponse.json({ ok: true, payload });
    }

    const applicantName = typeof body.applicantName === "string" ? body.applicantName.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";
    if (!applicantName || !email.includes("@")) {
      return NextResponse.json({ error: "applicantName and valid email required" }, { status: 400 });
    }

    const row = await createCreditCheck({
      transactionId: id,
      applicantName,
      email,
      billing: { actorRole: auth.role },
    });

    await sendRequest(row.id);
    const payload = await fetchResult(row.id);

    return NextResponse.json({
      ok: true,
      creditCheckId: row.id,
      payload,
    });
  } catch (e) {
    logError("[transactions.credit.post]", { error: e });
    const msg = e instanceof Error ? e.message : "Failed";
    const status =
      msg.includes("Subscription") || msg.includes("requires") || msg.includes("early access") ? 403 : 400;
    return NextResponse.json({ error: msg }, { status });
  }
}
