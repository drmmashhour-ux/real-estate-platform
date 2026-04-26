import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { requireBrokerOrAdminTransactionSession } from "@/lib/transactions/require-sd-transaction-session";
import { getLegacyDB } from "@/lib/db/legacy";
const prisma = getLegacyDB();
import { getTransactionById } from "@/modules/transactions/transaction.service";
import { canAccessTransaction } from "@/modules/transactions/transaction-policy";
import { sendPacket } from "@/modules/transactions/transaction-signature.service";

export const dynamic = "force-dynamic";

export async function POST(_req: Request, context: { params: Promise<{ packetId: string }> }) {
  const auth = await requireBrokerOrAdminTransactionSession();
  if (!auth.ok) return auth.response;

  const { packetId } = await context.params;

  try {
    const packet = await prisma.lecipmSdSignaturePacket.findUnique({
      where: { id: packetId },
      select: { transactionId: true },
    });
    if (!packet) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const tx = await getTransactionById(packet.transactionId);
    if (!tx || !canAccessTransaction(auth.role, auth.userId, tx.brokerId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await sendPacket(packetId, { actorRole: auth.role });
    return NextResponse.json({ packet: updated });
  } catch (e) {
    logError("[signatures.packet.send]", { error: e });
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
