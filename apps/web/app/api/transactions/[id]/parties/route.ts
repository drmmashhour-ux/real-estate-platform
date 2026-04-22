import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { requireBrokerOrAdminTransactionSession } from "@/lib/transactions/require-sd-transaction-session";
import { getTransactionById } from "@/modules/transactions/transaction.service";
import { canAccessTransaction } from "@/modules/transactions/transaction-policy";
import { addParty, listParties } from "@/modules/transactions/transaction-party.service";

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

    const parties = await listParties(id);
    return NextResponse.json({
      transactionNumber: tx.transactionNumber,
      parties,
    });
  } catch (e) {
    logError("[transaction.api.parties.list]", { error: e });
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await requireBrokerOrAdminTransactionSession();
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  if (!id?.trim()) return NextResponse.json({ error: "id required" }, { status: 400 });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const role = typeof body.role === "string" ? body.role.trim().toUpperCase() : "";
  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : null;
  const phone = typeof body.phone === "string" ? body.phone.trim() : null;

  if (!displayName || !role) {
    return NextResponse.json({ error: "role and displayName required" }, { status: 400 });
  }

  try {
    const tx = await getTransactionById(id);
    if (!tx) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (!canAccessTransaction(auth.role, auth.userId, tx.brokerId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const party = await addParty({
      transactionId: id,
      role: role as "SELLER" | "BUYER" | "BROKER",
      displayName,
      email,
      phone,
    });

    return NextResponse.json({
      transactionNumber: tx.transactionNumber,
      party,
    });
  } catch (e) {
    logError("[transaction.api.parties.post]", { error: e });
    const msg = e instanceof Error ? e.message : "Failed";
    const status = msg.includes("Invalid") ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
