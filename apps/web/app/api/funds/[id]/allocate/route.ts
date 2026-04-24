import { NextResponse } from "next/server";
import { withDomainProtection } from "@/lib/compliance/domain-protection";
import { FundAllocationService } from "@/modules/fund/fund-allocation.service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withDomainProtection({
    domain: "FINANCIAL",
    action: "INVEST_CAPITAL",
    handler: async (userId) => {
      try {
        const fund = await FundAllocationService.runFundAllocation(id);
        return NextResponse.json({ ok: true, fund });
      } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
  });
}
