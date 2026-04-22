import { NextResponse } from "next/server";
import { requireCompanyInvestorApiAuth } from "@/lib/investor-company/api-auth";
import { getInvestorValuationPayload } from "@/modules/investor-company/investor-company-metrics.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireCompanyInvestorApiAuth();
  if (!auth.ok) return auth.response;

  const data = await getInvestorValuationPayload(new Date());

  return NextResponse.json({ asOf: new Date().toISOString(), ...data }, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}
