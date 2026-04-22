import { NextResponse } from "next/server";
import { logError } from "@/lib/logger";
import { requireBrokerOrAdminTransactionSession } from "@/lib/transactions/require-sd-transaction-session";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Broker launch referral row — rewards applied manually or via billing webhooks later. */
export async function POST(req: Request) {
  const auth = await requireBrokerOrAdminTransactionSession();
  if (!auth.ok) return auth.response;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const referredEmail = typeof body.referredEmail === "string" ? body.referredEmail.trim().toLowerCase() : "";
  if (!referredEmail.includes("@")) {
    return NextResponse.json({ error: "referredEmail required" }, { status: 400 });
  }

  try {
    const row = await prisma.lecipmBrokerLaunchReferral.create({
      data: {
        referrerUserId: auth.userId,
        referredEmail,
      },
    });
    return NextResponse.json({
      id: row.id,
      referredEmail: row.referredEmail,
      rewardGiven: row.rewardGiven,
    });
  } catch (e) {
    logError("[broker-referral]", { error: e });
    return NextResponse.json({ error: "Failed to record referral" }, { status: 400 });
  }
}
