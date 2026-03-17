import { NextRequest } from "next/server";
import {
  createEnforcementAction,
  getEnforcementHistory,
  submitAppeal,
  getPendingAppeals,
  reviewAppeal,
} from "@/lib/defense/enforcement";
import type { EnforcementActionType } from "@prisma/client";

export const dynamic = "force-dynamic";

const ACTION_TYPES: EnforcementActionType[] = [
  "WARNING", "TEMPORARY_RESTRICTION", "LISTING_FREEZE", "BOOKING_LIMITATION",
  "PAYOUT_HOLD", "ACCOUNT_SUSPENSION", "PERMANENT_BAN", "MARKET_SPECIFIC",
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const appeals = searchParams.get("appeals") === "true";
    if (appeals) {
      const list = searchParams.get("pending") === "true"
        ? await getPendingAppeals(50)
        : [];
      return Response.json(list);
    }
    if (userId) {
      const history = await getEnforcementHistory(userId, 50);
      return Response.json(history);
    }
    return Response.json({ error: "userId required for history" }, { status: 400 });
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to get enforcement data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.appeal === true) {
      const { enforcementId, userId, reasonCode, description } = body;
      if (!userId || !description) {
        return Response.json({ error: "userId, description required for appeal" }, { status: 400 });
      }
      const appeal = await submitAppeal({ enforcementId, userId, reasonCode, description });
      return Response.json(appeal);
    }
    if (body.reviewAppeal === true && body.appealId) {
      const { appealId, decision, reviewedBy, outcomeNotes } = body;
      if (decision !== "APPROVED" && decision !== "REJECTED") {
        return Response.json({ error: "decision must be APPROVED or REJECTED" }, { status: 400 });
      }
      const appeal = await reviewAppeal(appealId, decision, reviewedBy ?? "admin", outcomeNotes);
      return Response.json(appeal);
    }
    const { userId, actionType, severity, reasonCode, reasonText, marketId, expiresAt, performedBy, metadata } = body;
    if (!userId || !actionType || !severity || !reasonCode) {
      return Response.json(
        { error: "userId, actionType, severity, reasonCode required" },
        { status: 400 }
      );
    }
    if (!ACTION_TYPES.includes(actionType)) {
      return Response.json({ error: "Invalid actionType" }, { status: 400 });
    }
    const action = await createEnforcementAction({
      userId,
      actionType,
      severity,
      reasonCode,
      reasonText,
      marketId,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      performedBy,
      metadata,
    });
    return Response.json(action);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to create enforcement or appeal" }, { status: 500 });
  }
}
