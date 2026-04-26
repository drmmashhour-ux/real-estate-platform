import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { requireBrokerOrAdminTransactionSession } from "@/lib/transactions/require-sd-transaction-session";
import { getTransactionById } from "@/modules/transactions/transaction.service";
import { canAccessTransaction } from "@/modules/transactions/transaction-policy";
import {
  evaluateCompliance,
  recordComplianceFinding,
  resolveComplianceCheck,
} from "@/modules/transactions/transaction-compliance.service";

export const dynamic = "force-dynamic";

async function guardTx(id: string, auth: { userId: string; role: string }) {
  const tx = await getTransactionById(id);
  if (!tx) return { ok: false as const, response: NextResponse.json({ error: "Not found" }, { status: 404 }) };
  if (!canAccessTransaction(auth.role, auth.userId, tx.brokerId)) {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true as const };
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireBrokerOrAdminTransactionSession();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const g = await guardTx(id, auth);
  if (!g.ok) return g.response;

  try {
    const evaluation = await evaluateCompliance(id);
    const checks = await prisma.lecipmSdComplianceCheck.findMany({
      where: { transactionId: id },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ evaluation, checks });
  } catch (e) {
    logError("[sd.compliance.get]", { error: e });
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

  const action = typeof body.action === "string" ? body.action : "";

  try {
    if (action === "record") {
      const checkType = typeof body.checkType === "string" ? body.checkType : "OTHER";
      const severity = body.severity === "WARNING" || body.severity === "BLOCKING" ? body.severity : "WARNING";
      const message = typeof body.message === "string" ? body.message : "";
      if (!message.trim()) return NextResponse.json({ error: "message required" }, { status: 400 });
      const documentId = typeof body.documentId === "string" ? body.documentId : undefined;
      const row = await recordComplianceFinding({
        transactionId: id,
        documentId,
        checkType,
        severity,
        message,
      });
      return NextResponse.json({ check: row });
    }

    if (action === "resolve") {
      const checkId = typeof body.checkId === "string" ? body.checkId : "";
      if (!checkId) return NextResponse.json({ error: "checkId required" }, { status: 400 });
      await resolveComplianceCheck(checkId, id);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    logError("[sd.compliance.post]", { error: e });
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
