import { NextRequest } from "next/server";
import { getPendingApprovals, createApprovalRequest, reviewApprovalRequest } from "@/lib/defense/internal-access";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const list = await getPendingApprovals(50);
    return Response.json(list);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to get approvals" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (body.decision !== undefined && body.id) {
      const { id, decision, reviewedBy, reviewNotes } = body;
      if (decision !== "APPROVED" && decision !== "REJECTED") {
        return Response.json({ error: "decision must be APPROVED or REJECTED" }, { status: 400 });
      }
      const req = await reviewApprovalRequest(id, decision, reviewedBy ?? "admin", reviewNotes);
      return Response.json(req);
    }
    const { requestType, requestedBy, targetType, targetId, reasonCode, payload } = body;
    if (!requestType || !requestedBy) {
      return Response.json({ error: "requestType, requestedBy required" }, { status: 400 });
    }
    const req = await createApprovalRequest({
      requestType,
      requestedBy,
      targetType,
      targetId,
      reasonCode,
      payload,
    });
    return Response.json(req);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to create or review approval" }, { status: 500 });
  }
}
