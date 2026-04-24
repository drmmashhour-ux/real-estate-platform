import { NextRequest, NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import {
  getOaciqDisclosureBundleForTransaction,
  updateOaciqTransactionDisclosureProfile,
} from "@/lib/compliance/oaciq/client-disclosure";

export const dynamic = "force-dynamic";

/**
 * PATCH — transaction broker updates OACIQ disclosure copy / conflict flags.
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const { id: transactionId } = await context.params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const patch: Parameters<typeof updateOaciqTransactionDisclosureProfile>[0]["patch"] = {};
  if (typeof body.brokerStatusBody === "string") patch.brokerStatusBody = body.brokerStatusBody;
  if (typeof body.conflictBody === "string") patch.conflictBody = body.conflictBody;
  if (typeof body.financialInterestBody === "string") patch.financialInterestBody = body.financialInterestBody;
  if (body.hasBrokerConflict === true || body.hasBrokerConflict === false) {
    patch.hasBrokerConflict = body.hasBrokerConflict;
  }
  if (body.hasBrokerFinancialInterest === true || body.hasBrokerFinancialInterest === false) {
    patch.hasBrokerFinancialInterest = body.hasBrokerFinancialInterest;
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  try {
    await updateOaciqTransactionDisclosureProfile({
      transactionId,
      brokerUserId: userId,
      patch,
    });
    const bundle = await getOaciqDisclosureBundleForTransaction(transactionId);
    return NextResponse.json({ ok: true, bundle });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Update failed" }, { status: 400 });
  }
}
