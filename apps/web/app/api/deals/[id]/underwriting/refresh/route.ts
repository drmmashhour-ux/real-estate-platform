import { NextRequest, NextResponse } from "next/server";
import { withDomainProtection } from "@/lib/compliance/domain-protection";
import { runAndAttachUnderwritingToDeal } from "@/modules/investment-ai/deal-underwriting.integration.service";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  
  return withDomainProtection({
    domain: "BROKERAGE",
    action: "MANAGE_PIPELINE",
    entityId: id,
    handler: async (userId) => {
      // Force refresh since it was manually triggered
      await runAndAttachUnderwritingToDeal(id, { 
        source: "MANUAL_REFRESH", 
        force: true 
      });

      return NextResponse.json({ ok: true, message: "Underwriting refresh triggered" });
    }
  });
}
