import { NextResponse } from "next/server";
import { withDomainProtection } from "@/lib/compliance/domain-protection";
import { FundService } from "@/modules/fund/fund.service";

export async function POST(req: Request) {
  return withDomainProtection({
    domain: "FINANCIAL",
    action: "MANAGE_ENTITIES",
    handler: async (userId) => {
      const body = await req.json();
      const fund = await FundService.createFund({
        name: body.name,
        strategyMode: body.strategyMode,
        initialCapital: body.initialCapital,
      });
      return NextResponse.json({ ok: true, fund });
    }
  });
}
