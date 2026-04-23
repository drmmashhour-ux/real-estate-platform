import { NextRequest, NextResponse } from "next/server";
import { toggleDomainKillSwitch } from "@/modules/autonomy/services/autonomy-kill-switch.service";

export async function POST(req: NextRequest) {
  try {
    const { domain, isEnabled, reason } = await req.json();
    
    // Mock user ID
    const mockUserId = "admin-user-id";

    const result = await toggleDomainKillSwitch(domain, isEnabled, mockUserId, reason);

    if (result.ok) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
  } catch (error) {
    console.error("Failed to toggle kill switch", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
