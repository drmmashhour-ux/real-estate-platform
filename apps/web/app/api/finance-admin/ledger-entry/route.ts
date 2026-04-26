import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import type { FinAdminDomain, FinLedgerEntryType } from "@prisma/client";
import { canAccessFinanceAdminHub } from "@/lib/admin/finance-hub-access";
import { createHubLedgerEntry } from "@/modules/finance-admin/finance-admin-ledger.service";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!canAccessFinanceAdminHub(user?.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const accountId = typeof body.accountId === "string" ? body.accountId : "";
  const domain = body.domain as FinAdminDomain;
  const entryType = body.entryType as FinLedgerEntryType;
  const referenceType = typeof body.referenceType === "string" ? body.referenceType : "manual";
  const amount = typeof body.amount === "string" ? body.amount : String(body.amount ?? "");
  const effectiveDate =
    typeof body.effectiveDate === "string" ? new Date(body.effectiveDate) : new Date();

  if (!accountId || !domain || !entryType || !amount) {
    return NextResponse.json({ error: "accountId, domain, entryType, amount required" }, { status: 400 });
  }

  try {
    const row = await createHubLedgerEntry({
      accountId,
      domain,
      entryType,
      referenceType,
      referenceId: typeof body.referenceId === "string" ? body.referenceId : null,
      amount,
      taxExclusiveAmount: typeof body.taxExclusiveAmount === "string" ? body.taxExclusiveAmount : null,
      gstAmount: typeof body.gstAmount === "string" ? body.gstAmount : null,
      qstAmount: typeof body.qstAmount === "string" ? body.qstAmount : null,
      effectiveDate,
      counterpartyId: typeof body.counterpartyId === "string" ? body.counterpartyId : null,
      notes: typeof body.notes === "object" && body.notes ? (body.notes as Record<string, unknown>) : null,
    });
    return NextResponse.json({ entry: row });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Failed" }, { status: 400 });
  }
}
