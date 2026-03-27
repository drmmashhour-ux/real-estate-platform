import { NextResponse } from "next/server";
import { getInvestorHubAnalytics } from "@/modules/investor/investor-analytics";
import { requireInvestorApiSession } from "../_lib";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await requireInvestorApiSession();
  if (!session.ok) {
    return NextResponse.json({ error: session.error }, { status: session.status });
  }
  const data = await getInvestorHubAnalytics(30);
  return NextResponse.json(data);
}
