import { NextResponse } from "next/server";
import { PlatformRole } from "@prisma/client";
import { getGuestId } from "@/lib/auth/session";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { canMutateExecution } from "@/lib/deals/execution-access";
import { prisma } from "@/lib/db";
import { approvePendingBrokerApproval, rejectBrokerApproval } from "@/modules/approval/broker-approval-workflow.service";
import { SIGNATURE_CENTER_BROKER_ACK_TEXT } from "@/lib/approval/signature-center-ack";

export const dynamic = "force-dynamic";

function approvalIdFromItemKey(itemKey: string): string | null {
  if (!itemKey.startsWith("approval:")) return null;
  const rest = itemKey.slice("approval:".length);
  return rest.replace(/:investor$/, "");
}

/**
 * POST /api/broker/signature-center/action — sign (approve) or reject broker approval items from the signature center.
 * Other item types should be completed in-context via editHref (UI opens deal workspace).
 */
export async function POST(request: Request) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user || (user.role !== PlatformRole.BROKER && user.role !== PlatformRole.ADMIN)) {
    return NextResponse.json({ error: "Broker access only" }, { status: 403 });
  }

  let body: {
    itemKey?: string;
    action?: "sign" | "reject";
    oaciqAcknowledged?: boolean;
    ackText?: string;
    rejectionReason?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const itemKey = typeof body.itemKey === "string" ? body.itemKey.trim() : "";
  if (!itemKey) return NextResponse.json({ error: "itemKey required" }, { status: 400 });

  const approvalId = approvalIdFromItemKey(itemKey);
  if (!approvalId) {
    return NextResponse.json(
      {
        error: "Signing from the hub is only supported for broker approval rows. Use “Edit before sign” for documents, closing, or payments.",
        code: "UNSUPPORTED_ITEM",
      },
      { status: 409 },
    );
  }

  const pending = await prisma.brokerApproval.findFirst({
    where: { id: approvalId, status: "PENDING" },
    select: { id: true, dealId: true },
  });
  if (!pending) {
    return NextResponse.json({ error: "Pending approval not found or already decided." }, { status: 404 });
  }

  const auth = await authenticateBrokerDealRoute(pending.dealId);
  if (!auth.ok) return auth.response;

  if (!canMutateExecution(userId, user.role, auth.deal)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (body.action === "reject") {
    const reason = typeof body.rejectionReason === "string" ? body.rejectionReason.trim() : "";
    if (reason.length < 4) {
      return NextResponse.json({ error: "Rejection reason required (min 4 chars)." }, { status: 400 });
    }
    try {
      await rejectBrokerApproval({ approvalId, brokerUserId: userId, reason });
      return NextResponse.json({ ok: true, result: "rejected" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Reject failed";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
  }

  if (body.action !== "sign") {
    return NextResponse.json({ error: "action must be sign or reject" }, { status: 400 });
  }

  if (body.oaciqAcknowledged !== true) {
    return NextResponse.json({ error: "Broker acknowledgment checkbox must be confirmed." }, { status: 400 });
  }
  if (body.ackText !== SIGNATURE_CENTER_BROKER_ACK_TEXT) {
    return NextResponse.json({ error: "Acknowledgment text mismatch — refresh the page." }, { status: 400 });
  }

  try {
    const out = await approvePendingBrokerApproval({
      approvalId,
      brokerUserId: userId,
      oaciqBrokerAcknowledged: true,
      afterSnapshot: { source: "signature_center_dashboard", ack: SIGNATURE_CENTER_BROKER_ACK_TEXT },
    });
    return NextResponse.json({ ok: true, result: "signed", ...out });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Approve failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
