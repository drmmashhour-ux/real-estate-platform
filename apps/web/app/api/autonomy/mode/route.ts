import { NextRequest, NextResponse } from "next/server";
import { updateAutonomyMode } from "@/modules/autonomy/services/autonomy-kill-switch.service";

export async function POST(req: NextRequest) {
  try {
    const { mode, reason } = await req.json();
    
    // Mock user ID
    const mockUserId = "admin-user-id";

    const result = await updateAutonomyMode(mode, mockUserId, reason);

    if (result.ok) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } catch (error) {
    console.error("Failed to update autonomy mode", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
