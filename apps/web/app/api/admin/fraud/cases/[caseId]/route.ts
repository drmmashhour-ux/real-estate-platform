import { NextRequest } from "next/server";
import type { FraudCaseStatus } from "@prisma/client";
import { requireAdminSession } from "@/lib/admin/require-admin";
import {
  holdListingForCaseAction,
  recordFraudDecisionAction,
  setFraudCaseStatusAction,
  suspendUserForCaseAction,
} from "@/lib/fraud/admin-case-actions";

export const dynamic = "force-dynamic";

const STATUSES: FraudCaseStatus[] = [
  "open",
  "under_review",
  "confirmed_fraud",
  "false_positive",
  "resolved",
];

/** POST JSON: { status?, action?: "suspend_user" | "hold_listing", notes? } */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ caseId: string }> }
) {
  const auth = await requireAdminSession();
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  const { caseId } = await context.params;
  const body = (await request.json()) as {
    status?: FraudCaseStatus;
    action?: "suspend_user" | "hold_listing";
    notes?: string;
  };

  try {
    if (body.status && STATUSES.includes(body.status)) {
      await setFraudCaseStatusAction(caseId, body.status, body.notes);
    }
    if (body.action === "suspend_user") {
      await suspendUserForCaseAction(caseId);
    } else if (body.action === "hold_listing") {
      await holdListingForCaseAction(caseId);
    } else if (body.notes && !body.status) {
      await recordFraudDecisionAction({ caseId, actionLabel: "note", notes: body.notes });
    }
    return Response.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed";
    return Response.json({ error: msg }, { status: 400 });
  }
}
