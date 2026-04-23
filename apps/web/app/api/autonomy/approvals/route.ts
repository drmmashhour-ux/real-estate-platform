import { NextResponse } from "next/server";
import { listPendingApprovals } from "@/modules/autonomy/services/autonomy-approval-inbox.service";

export async function GET() {
  try {
    const approvals = await listPendingApprovals();
    return NextResponse.json({ approvals });
  } catch (error) {
    console.error("Failed to list approvals", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
