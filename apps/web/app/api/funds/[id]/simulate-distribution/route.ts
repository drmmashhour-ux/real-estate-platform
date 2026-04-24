import { NextResponse } from "next/server";
import { withDomainProtection } from "@/lib/compliance/domain-protection";
import { FundDistributionService } from "@/modules/fund/fund-distribution.service";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return withDomainProtection({
    domain: "FINANCIAL",
    action: "DISTRIBUTE_PROFITS",
    handler: async (userId) => {
      try {
        const distributions = await FundDistributionService.simulateDistributions(id);
        return NextResponse.json({ ok: true, distributions });
      } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }
  });
}
