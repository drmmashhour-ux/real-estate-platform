import { NextRequest } from "next/server";
import { logPrivilegedAction, getPrivilegedActions } from "@/lib/defense/internal-access";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const actions = await getPrivilegedActions({
      adminId: searchParams.get("adminId") ?? undefined,
      actionType: searchParams.get("actionType") ?? undefined,
      from: searchParams.get("from") ? new Date(searchParams.get("from")!) : undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!, 10) : 100,
    });
    return Response.json(actions);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to get privileged actions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminId, actionType, entityType, entityId, reasonCode, reasonText, approvalId, metadata } = body;
    if (!adminId || !actionType) {
      return Response.json({ error: "adminId, actionType required" }, { status: 400 });
    }
    const action = await logPrivilegedAction({
      adminId,
      actionType,
      entityType,
      entityId,
      reasonCode,
      reasonText,
      approvalId,
      metadata,
    });
    return Response.json(action);
  } catch (e) {
    console.error(e);
    return Response.json({ error: "Failed to log privileged action" }, { status: 500 });
  }
}
