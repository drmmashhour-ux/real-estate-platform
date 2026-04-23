import { NextRequest, NextResponse } from "next/server";
import { approveAutonomousAction, rejectAutonomousAction } from "@/modules/autonomy/approval.service";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { action, reason } = await req.json();
    const { id } = params;
    
    // In a real app, we'd get the actual user ID from the session
    const mockUserId = "admin-user-id";

    let result;
    if (action === "approve") {
      result = await approveAutonomousAction(id, mockUserId, reason);
    } else if (action === "reject") {
      result = await rejectAutonomousAction(id, mockUserId, reason);
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (result.ok) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } catch (error) {
    console.error("Failed to process approval action", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
