import { NextResponse } from "next/server";
import { getFullMarketIntelligence } from "@/modules/ai/market-intelligence";
import { requireInvestorApiSession } from "../_lib";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireInvestorApiSession();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }
  const data = await getFullMarketIntelligence();
  return NextResponse.json(data);
}
