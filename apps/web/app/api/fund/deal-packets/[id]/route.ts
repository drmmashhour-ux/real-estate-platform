import { NextResponse } from "next/server";
import { getGuestId } from "@/lib/auth/session";
import { DealInvestorBridgeService } from "@/lib/compliance/deal-investor-bridge.service";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getGuestId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const packetId = params.id;

  try {
    const packet = await DealInvestorBridgeService.getDealPacketForFund(userId, packetId);
    return NextResponse.json({ success: true, packet });
  } catch (error: any) {
    console.error("[get-deal-packet] Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
