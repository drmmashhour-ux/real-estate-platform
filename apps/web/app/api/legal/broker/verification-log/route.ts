import { NextRequest, NextResponse } from "next/server";
import { getGuestId, getUserRole } from "@/lib/auth/session";
import { persistBrokerVerificationLog } from "@/modules/legal/repositories/broker-verification-log.repository";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const role = await getUserRole();
  if (role !== "BROKER") return NextResponse.json({ error: "Broker only" }, { status: 403 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const actionKey = typeof body.actionKey === "string" ? body.actionKey.trim() : "";
  if (!actionKey) return NextResponse.json({ error: "actionKey required" }, { status: 400 });

  const id = await persistBrokerVerificationLog({
    brokerUserId: userId,
    fsboListingId: typeof body.fsboListingId === "string" ? body.fsboListingId : null,
    bnhubHostListingId: typeof body.bnhubHostListingId === "string" ? body.bnhubHostListingId : null,
    actionKey,
    sourceDisclosed: body.sourceDisclosed === true,
    verificationAttempted: body.verificationAttempted === true,
    warningIssued: body.warningIssued === true,
    sellerMarkedUncooperative: body.sellerMarkedUncooperative === true,
    notes: typeof body.notes === "string" ? body.notes.slice(0, 4000) : null,
    metadata: typeof body.metadata === "object" && body.metadata !== null ? (body.metadata as Record<string, unknown>) : null,
  });

  return NextResponse.json({ ok: !!id, id });
}
