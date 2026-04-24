import { NextResponse } from "next/server";
import { getExecutiveSummary } from "@/modules/ceo-ai/ceo-ai.service";
import { withDomainProtection } from "@/lib/compliance/domain-protection";

export const dynamic = "force-dynamic";

export async function GET() {
  return withDomainProtection({
    domain: "PLATFORM",
    action: "VIEW_ANALYTICS",
    handler: async (_userId) => {
      const summary = await getExecutiveSummary();
      return NextResponse.json({ ok: true, ...summary });
    }
  });
}
