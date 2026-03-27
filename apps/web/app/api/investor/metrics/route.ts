import { NextResponse } from "next/server";
import { getInvestorMetrics } from "@/modules/investor/investor-metrics";
import { requireInvestorApiSession } from "../_lib";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireInvestorApiSession();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }
  const data = await getInvestorMetrics(30);
  return NextResponse.json(data);
}
