import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { requireBrokerOrAdminTransactionSession } from "@/lib/transactions/require-sd-transaction-session";
import { getTransactionById } from "@/modules/transactions/transaction.service";
import { canAccessTransaction } from "@/modules/transactions/transaction-policy";
import {
  addSigner,
  createSignaturePacket,
  listSignaturePackets,
} from "@/modules/transactions/transaction-signature.service";

export const dynamic = "force-dynamic";

async function guardTx(id: string, auth: { userId: string; role: string }) {
  const tx = await getTransactionById(id);
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
    const packets = await listSignaturePackets(id);
    return NextResponse.json({ packets });
  } catch (e) {
    logError("[sd.signatures.get]", { error: e });
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
    if (action === "create") {
      const documentId = typeof body.documentId === "string" ? body.documentId : "";
      if (!documentId) return NextResponse.json({ error: "documentId required" }, { status: 400 });
      const packet = await createSignaturePacket(id, documentId);
      return NextResponse.json({ packet });
    }

    if (action === "addSigner") {
      const packetId = typeof body.packetId === "string" ? body.packetId : "";
      const role = typeof body.role === "string" ? body.role : "";
      const name = typeof body.name === "string" ? body.name : "";
      const email = typeof body.email === "string" ? body.email : "";
      if (!packetId || !role || !name || !email) {
        return NextResponse.json({ error: "packetId, role, name, email required" }, { status: 400 });
      }
      const signer = await addSigner(packetId, { role, name, email });
      return NextResponse.json({ signer });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    logError("[sd.signatures.post]", { error: e });
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
