import { NextRequest, NextResponse } from "next/server";
import type { OaciqClientDisclosureFlow } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import {
  assertTransactionParty,
  getOaciqDisclosureBundleForTransaction,
  hasValidOaciqClientDisclosureAck,
  OACIQ_CLIENT_MANDATORY_DISCLOSURE_ACK_TEXT,
  oaciqClientDisclosureEnforcementEnabled,
} from "@/lib/compliance/oaciq/client-disclosure";

export const dynamic = "force-dynamic";

const FLOWS = new Set<string>(["OFFER_SUBMIT", "CONTRACT_SIGN", "AGREEMENT"]);

function parseFlow(s: string | null): OaciqClientDisclosureFlow | null {
  if (!s || !FLOWS.has(s)) return null;
  return s as OaciqClientDisclosureFlow;
}

/**
 * GET — disclosure bundle + ack status for a transaction (buyer or seller).
 */
export async function GET(req: NextRequest) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const transactionId = req.nextUrl.searchParams.get("transactionId")?.trim() ?? "";
  const flowRaw = req.nextUrl.searchParams.get("flow");
  const flow = parseFlow(flowRaw);
  if (!transactionId || !flow) {
    return NextResponse.json({ error: "transactionId and valid flow are required" }, { status: 400 });
  }

  try {
    await assertTransactionParty(transactionId, userId);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Forbidden" }, { status: 403 });
  }

  const bundle = await getOaciqDisclosureBundleForTransaction(transactionId);
  const ackValid = await hasValidOaciqClientDisclosureAck({ transactionId, userId, flow });

  return NextResponse.json({
    enforcementEnabled: oaciqClientDisclosureEnforcementEnabled(),
    flow,
    bundle,
    ackValid,
    mandatoryAckText: OACIQ_CLIENT_MANDATORY_DISCLOSURE_ACK_TEXT,
  });
}
