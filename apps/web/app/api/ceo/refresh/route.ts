import { NextResponse } from "next/server";
import { withDomainProtection } from "@/lib/compliance/domain-protection";
import { CeoCommandService } from "@/modules/ceo/ceo-command.service";

export async function POST(req: Request) {
  const { period } = await req.json();
  
  return withDomainProtection({
    domain: "PLATFORM",
    action: "GENERATE_ALLOCATION",
    handler: async (userId) => {
      const snapshot = await CeoCommandService.generateStrategicSnapshot(period || "WEEKLY");
      return NextResponse.json({ ok: true, snapshot });
    }
  });
}
