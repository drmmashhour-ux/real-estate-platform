import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { requireBrokerOrAdminTransactionSession } from "@/lib/transactions/require-sd-transaction-session";
import { prisma } from "@repo/db";
import { getTransactionById } from "@/modules/transactions/transaction.service";
import { canAccessTransaction } from "@/modules/transactions/transaction-policy";
import { signDocument } from "@/modules/transactions/transaction-signature.service";

export const dynamic = "force-dynamic";

function clientIp(req: Request): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() ?? null;
  return null;
}

export async function POST(req: Request, context: { params: Promise<{ signerId: string }> }) {
  const auth = await requireBrokerOrAdminTransactionSession();
  if (!auth.ok) return auth.response;

  const { signerId } = await context.params;

  try {
    const signer = await prisma.lecipmSdSignatureSigner.findUnique({
      where: { id: signerId },
      select: { transactionId: true },
    });
    if (!signer) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const tx = await getTransactionById(signer.transactionId);
    if (!tx || !canAccessTransaction(auth.role, auth.userId, tx.brokerId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ua = req.headers.get("user-agent");
    const ip = clientIp(req);

    const updated = await signDocument(signerId, { ipAddress: ip, userAgent: ua });
    return NextResponse.json({ signer: updated });
  } catch (e) {
    logError("[signatures.signer.sign]", { error: e });
    const msg = e instanceof Error ? e.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
