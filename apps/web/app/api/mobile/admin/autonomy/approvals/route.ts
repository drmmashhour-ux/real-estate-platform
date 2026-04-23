import { NextResponse } from "next/server";
import { listPendingApprovals } from "@/modules/autonomy/services/autonomy-approval-inbox.service";

export async function GET() {
  try {
    const approvals = await listPendingApprovals();
    // Return a lightweight version for mobile
    const lightweightApprovals = approvals.map(a => ({
      id: a.id,
      domain: a.domain,
      actionType: a.actionType,
      riskLevel: a.riskLevel,
      createdAt: a.createdAt,
    })).slice(0, 10);

    return NextResponse.json({ approvals: lightweightApprovals });
  } catch (error) {
    console.error("Failed to get mobile approvals", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
