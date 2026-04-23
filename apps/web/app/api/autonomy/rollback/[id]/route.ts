import { NextRequest, NextResponse } from "next/server";
import { performRollback } from "@/modules/autonomy/actions/autonomy-rollback.service";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { reason } = await req.json();
    const { id } = params;
    
    // Mock user ID
    const mockUserId = "admin-user-id";

    const result = await performRollback(id, mockUserId, reason);

    if (result.ok) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } catch (error) {
    console.error("Failed to perform rollback", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
