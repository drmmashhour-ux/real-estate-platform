import { NextResponse } from "next/server";
import { authenticateBrokerDealRoute } from "@/lib/deals/broker-draft-auth";
import { recordPrivateInvestorPacketExport } from "@/modules/private-investor-packet/private-investor-packet-export.service";

export const dynamic = "force-dynamic";

/** POST — log audited export of a specific packet version (client may download HTML separately). */
export async function POST(request: Request, context: { params: Promise<{ id: string; investorId: string }> }) {
  const { id: dealId, investorId } = await context.params;
  const auth = await authenticateBrokerDealRoute(dealId);
  if (!auth.ok) return auth.response;
  if (auth.deal.brokerId !== auth.userId && auth.role !== "ADMIN") {
    return NextResponse.json({ error: "Assignee broker only" }, { status: 403 });
  }

  let body: { packetId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const packetId = typeof body.packetId === "string" ? body.packetId.trim() : "";
  if (!packetId) {
    return NextResponse.json({ error: "packetId required" }, { status: 400 });
  }

  try {
    await recordPrivateInvestorPacketExport({
      dealId,
      investorId,
      packetId,
      brokerUserId: auth.userId,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const err = e as Error;
    const code = err.message;
    const status = code === "PACKET_NOT_FOUND" ? 404 : code === "BROKER_ONLY" ? 403 : 400;
    return NextResponse.json({ error: code }, { status });
  }
}
